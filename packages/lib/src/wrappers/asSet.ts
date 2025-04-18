import {
  action,
  intercept,
  IObservableArray,
  ISetWillChange,
  isObservableArray,
  observable,
  ObservableSet,
  observe,
  transaction,
  untracked,
} from "mobx"
import { assertIsObservableArray, assertIsSet, failure, getMobxVersion, inDevMode } from "../utils"
import { tag } from "../utils/tag"

const observableSetBackedByObservableArray = <T>(
  array: IObservableArray<T>
): ObservableSet<T> & { dataObject: typeof array } => {
  if (inDevMode) {
    if (!isObservableArray(array)) {
      throw failure("assertion failed: expected an observable array")
    }
  }

  const set = transaction(() =>
    untracked(() => {
      if (getMobxVersion() >= 6) {
        return observable.set(array)
      } else {
        const set = observable.set()
        array.forEach((item) => {
          set.add(item)
        })
        return set
      }
    })
  )
  ;(set as ObservableSet<T> & { dataObject: typeof array }).dataObject = array

  if (set.size !== array.length) {
    throw failure("arrays backing a set cannot contain duplicate values")
  }

  let setAlreadyChanged = false
  let arrayAlreadyChanged = false

  // for speed reasons we will just assume distinct values are only once in the array

  // when the array changes the set changes
  observe(
    array,
    action((change: any /*IArrayDidChange<T>*/) => {
      if (setAlreadyChanged) {
        return
      }

      arrayAlreadyChanged = true

      try {
        switch (change.type) {
          case "splice": {
            {
              const removed = change.removed
              for (let i = 0; i < removed.length; i++) {
                set.delete(removed[i])
              }
            }

            {
              const added = change.added
              for (let i = 0; i < added.length; i++) {
                set.add(added[i])
              }
            }

            break
          }

          case "update": {
            set.delete(change.oldValue)
            set.add(change.newValue)
            break
          }

          default:
            throw failure("assertion error: unsupported array change type")
        }
      } finally {
        arrayAlreadyChanged = false
      }
    })
  )

  // when the set changes also change the array
  intercept(
    set,
    action((change: ISetWillChange<T>) => {
      if (setAlreadyChanged) {
        return null
      }

      if (arrayAlreadyChanged) {
        return change
      }

      setAlreadyChanged = true

      try {
        switch (change.type) {
          case "add": {
            array.push(change.newValue)
            break
          }

          case "delete": {
            const i = array.indexOf(change.oldValue)
            if (i >= 0) {
              array.splice(i, 1)
            }
            break
          }

          default:
            throw failure("assertion error: unsupported set change type")
        }

        return change
      } finally {
        setAlreadyChanged = false
      }
    })
  )

  return set as ObservableSet<T> & { dataObject: typeof array }
}

const asSetTag = tag((array: Array<unknown>) => {
  assertIsObservableArray(array, "array")
  return observableSetBackedByObservableArray(array)
})

/**
 * Wraps an observable array to offer a set like interface.
 *
 * @param array
 */
export function asSet<T>(array: Array<T>): ObservableSet<T> & { dataObject: typeof array } {
  return asSetTag.for(array)
}

/**
 * Converts a set to an array. If the set is a collection wrapper it will return the backed array.
 *
 * @param set
 */
export function setToArray<T>(set: Set<T> | ObservableSet<T>): Array<T> {
  assertIsSet(set, "set")

  const dataObject = (set as Set<T> & { dataObject: Array<T> }).dataObject
  if (dataObject) {
    return dataObject
  }

  return Array.from(set.values())
}
