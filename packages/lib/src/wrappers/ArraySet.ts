import { values } from "mobx"
import { modelAction } from "../action/modelAction"
import { modelIdKey } from "../model/metadata"
import { Model } from "../model/Model"
import { model } from "../modelShared/modelDecorator"
import { idProp } from "../modelShared/prop"
import { typesArray } from "../types/arrayBased/typesArray"
import { tProp } from "../types/tProp"
import { typesUnchecked } from "../types/utility/typesUnchecked"
import { namespace } from "../utils"

/**
 * A set that is backed by an array.
 * Use `arraySet` to create it.
 */
@model(`${namespace}/ArraySet`)
export class ArraySet<V>
  extends Model({
    [modelIdKey]: idProp,
    items: tProp(typesArray(typesUnchecked<any>()), () => []), // will be properly checked by types.arraySet(subType)
  })
  implements Set<V>
{
  @modelAction
  add(value: V): this {
    const items = this.items

    if (!items.includes(value)) {
      items.push(value)
    }
    return this
  }

  @modelAction
  clear(): void {
    this.items.length = 0
  }

  @modelAction
  delete(value: V): boolean {
    const items = this.items

    const index = items.findIndex((t) => t === value)
    if (index >= 0) {
      items.splice(index, 1)
      return true
    } else {
      return false
    }
  }

  forEach(callbackfn: (value: V, value2: V, set: Set<V>) => void, thisArg?: any): void {
    // we cannot use the set implementation since we need to pass this as set
    const items = this.items
    const len = items.length
    for (let i = 0; i < len; i++) {
      const k = items[i]
      callbackfn.call(thisArg, k, k, this)
    }
  }

  has(value: V): boolean {
    return this.items.includes(value)
  }

  get size(): number {
    return this.items.length
  }

  *keys(): ReturnType<Set<V>["keys"]> {
    // yes, values
    for (const value of values(this.items)) {
      yield value
    }
  }

  *values(): ReturnType<Set<V>["values"]> {
    for (const value of values(this.items)) {
      yield value
    }
  }

  *entries(): ReturnType<Set<V>["entries"]> {
    for (const v of this.items) {
      yield [v, v]
    }
  }

  [Symbol.iterator](): ReturnType<Set<V>[typeof Symbol.iterator]> {
    return this.values()
  }

  readonly [Symbol.toStringTag] = "ArraySet"

  union<U>(other: ReadonlySetLike<U>): Set<V | U> {
    const s = new Set(this)
    return s.union(other)
  }

  intersection<U>(other: ReadonlySetLike<U>): Set<V & U> {
    const s = new Set(this)
    return s.intersection(other)
  }

  difference<U>(other: ReadonlySetLike<U>): Set<V> {
    const s = new Set(this)
    return s.difference(other)
  }

  symmetricDifference<U>(other: ReadonlySetLike<U>): Set<V | U> {
    const s = new Set(this)
    return s.symmetricDifference(other)
  }

  isSubsetOf(other: ReadonlySetLike<unknown>): boolean {
    const s = new Set(this)
    return s.isSubsetOf(other)
  }

  isSupersetOf(other: ReadonlySetLike<unknown>): boolean {
    const s = new Set(this)
    return s.isSupersetOf(other)
  }

  isDisjointFrom(other: ReadonlySetLike<unknown>): boolean {
    const s = new Set(this)
    return s.isDisjointFrom(other)
  }
}

/**
 * Creates a new ArraySet model instance.
 *
 * @template V Value type.
 * @param [values] Optional initial values.
 */
export function arraySet<V>(values?: ReadonlyArray<V> | null): ArraySet<V> {
  const initialArr: V[] = values ? values.slice() : []

  return new ArraySet({ items: initialArr })
}
