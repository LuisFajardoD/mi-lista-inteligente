// Catálogo central de roles: value = lo que se guarda en BD, label = lo que ve el usuario
export const ROLE_OPTIONS = [
  { value: "viewer",  label: "Lector" },
  { value: "editor",  label: "Editor" },
  { value: "owner",   label: "Propietario" },

  // agrega más aquí cuando quieras:
  { value: "commenter", label: "Comentarista" },
  { value: "guest",     label: "Invitado" },
];

// Utilidad para mostrar el nombre traducido en tablas/listas
export const roleLabel = (value: string) =>
  ROLE_OPTIONS.find(r => r.value === value)?.label ?? value;
