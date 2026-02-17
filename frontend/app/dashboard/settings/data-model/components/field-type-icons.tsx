/**
 * Field Type Icons and Colors
 * Maps field types to their icons and colors based on form elements library
 */

import {
  Type,
  Hash,
  Calendar,
  Image as ImageIcon,
  Link2,
  FileText,
  ToggleLeft,
  Braces,
  Mail,
  Key,
  List,
  KeyRound,
  Blocks,
  Puzzle,
  Database,
} from 'lucide-react'

export interface FieldTypeConfig {
  icon: React.ComponentType<{ className?: string }>
  color: string
  label: string
}

const fieldTypeMap: Record<string, FieldTypeConfig> = {
  // Text types
  text: {
    icon: Type,
    color: '#4CAF50', // Green
    label: 'Text',
  },
  string: {
    icon: Type,
    color: '#4CAF50', // Green
    label: 'Text',
  },
  // Number types
  number: {
    icon: Hash,
    color: '#F44336', // Red
    label: 'Number',
  },
  integer: {
    icon: Hash,
    color: '#F44336', // Red
    label: 'Number',
  },
  float: {
    icon: Hash,
    color: '#F44336', // Red
    label: 'Number',
  },
  // Date types
  date: {
    icon: Calendar,
    color: '#FF9800', // Orange
    label: 'Date',
  },
  datetime: {
    icon: Calendar,
    color: '#FF9800', // Orange
    label: 'Date',
  },
  timestamp: {
    icon: Calendar,
    color: '#FF9800', // Orange
    label: 'Date',
  },
  // Media types
  media: {
    icon: ImageIcon,
    color: '#9C27B0', // Purple
    label: 'Media',
  },
  file: {
    icon: ImageIcon,
    color: '#9C27B0', // Purple
    label: 'Media',
  },
  files: {
    icon: ImageIcon,
    color: '#9C27B0', // Purple
    label: 'Media',
  },
  // Relation types
  relation: {
    icon: Link2,
    color: '#2196F3', // Blue
    label: 'Relation',
  },
  m2o: {
    icon: Link2,
    color: '#2196F3', // Blue
    label: 'Relation',
  },
  o2m: {
    icon: Link2,
    color: '#2196F3', // Blue
    label: 'Relation',
  },
  m2m: {
    icon: Link2,
    color: '#2196F3', // Blue
    label: 'Relation',
  },
  // Rich text types
  blocks: {
    icon: Blocks,
    color: '#03A9F4', // Light blue
    label: 'Rich text (Blocks)',
  },
  markdown: {
    icon: FileText,
    color: '#1976D2', // Dark blue
    label: 'Rich text (Markdown)',
  },
  // Component
  component: {
    icon: Puzzle,
    color: '#757575', // Gray
    label: 'Component',
  },
  // Boolean
  boolean: {
    icon: ToggleLeft,
    color: '#4CAF50', // Green
    label: 'Boolean',
  },
  // JSON
  json: {
    icon: Braces,
    color: '#03A9F4', // Light blue
    label: 'JSON',
  },
  // Email
  email: {
    icon: Mail,
    color: '#F44336', // Red
    label: 'Email',
  },
  // Password
  password: {
    icon: Key,
    color: '#FF9800', // Orange
    label: 'Password',
  },
  // Enumeration
  enumeration: {
    icon: List,
    color: '#9C27B0', // Purple
    label: 'Enumeration',
  },
  // UID
  uid: {
    icon: KeyRound,
    color: '#2196F3', // Blue
    label: 'UID',
  },
  // Dynamic zone
  dynamiczone: {
    icon: Blocks,
    color: '#3F51B5', // Indigo
    label: 'Dynamic zone',
  },
  // Schema
  schema: {
    icon: Database,
    color: '#6B7280', // Gray
    label: 'Schema',
  },
}

/**
 * Get icon and color for a field type
 */
export function getFieldTypeConfig(type: string): FieldTypeConfig {
  const normalizedType = type.toLowerCase()
  return fieldTypeMap[normalizedType] || {
    icon: Type,
    color: '#757575', // Default gray
    label: type,
  }
}

/**
 * Get field type icon component
 */
export function getFieldTypeIcon(type: string): React.ComponentType<{ className?: string }> {
  return getFieldTypeConfig(type).icon
}

/**
 * Get field type color
 */
export function getFieldTypeColor(type: string): string {
  return getFieldTypeConfig(type).color
}

/**
 * Get field type label
 */
export function getFieldTypeLabel(type: string): string {
  return getFieldTypeConfig(type).label
}
