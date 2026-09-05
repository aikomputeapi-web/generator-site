export interface PluginMetadata {
  id: string;
  name: string;
  description: string;
  category: 'generator' | 'registration' | 'utility';
  icon: string; // Dynamic icon name referencing a Lucide icon
}

export interface ToolPlugin {
  metadata: PluginMetadata;
  component: React.ComponentType;
}
