import type {SchemaTypeDefinition} from 'sanity'
import {claim} from './claim'
import {contradiction} from './contradiction'
import {decision} from './decision'
import {tsb} from './tsb'

export const schemaTypes: SchemaTypeDefinition[] = [tsb, claim, contradiction, decision]
