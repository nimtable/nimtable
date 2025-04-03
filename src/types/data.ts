// Types for the sidebar data structure
export interface NamespaceTables {
    name: string // full namespace name
    shortName: string // last part of the namespace name
    tables: string[]
    children: NamespaceTables[]
}
