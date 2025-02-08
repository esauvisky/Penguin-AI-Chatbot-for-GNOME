/// <reference types="@girs/st-15" />
/// <reference types="@girs/gtk-4.0" />
/// <reference types="@girs/adw-1" />

// Map GJS imports to GIR typings
declare module 'gi://GObject' {
  export * from '@girs/st-15';
}
declare module 'gi://Soup' {
  export * from '@girs/st-15';
}
declare module 'gi://GLib' {
  export * from '@girs/st-15';
}
declare module 'gi://Meta' {
  export * from '@girs/st-15';
}
declare module 'gi://Shell' {
  export * from '@girs/st-15';
}
declare module 'gi://Pango' {
  export * from '@girs/st-15';
}

// GTK and LibAdwaita typings
declare module 'gi://Gtk' {
  export * from '@girs/gtk-4.0';
}
declare module 'gi://Adw' {
  export * from '@girs/adw-1';
}

// Map GNOME Shell UI imports
declare module 'resource:///org/gnome/shell/extensions/extension.js' {
  export * from 'gnome-shell/extensions/extension';
}
declare module 'resource:///org/gnome/shell/ui/panelMenu.js' {
  export * from 'gnome-shell/ui/panelMenu';
}
declare module 'resource:///org/gnome/shell/ui/popupMenu.js' {
  export * from 'gnome-shell/ui/popupMenu';
}
declare module 'resource:///org/gnome/shell/ui/main.js' {
  export * from 'gnome-shell/ui/main';
}

// Preferences module mapping
declare module 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js' {
  export * from 'gnome-shell/extensions/prefs';
}

// Local module aliasing
declare module './md2pango.js' {
  export * from './md2pango';
}
