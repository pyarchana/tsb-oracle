import type {SchemaTypeDefinition} from 'sanity'
import {claim} from './claim'
import {tsb} from './tsb'

export const schemaTypes: SchemaTypeDefinition[] = [tsb, claim]
