// src/services/index.js
export { default as authService } from './authService';
export { default as clientService } from './clientService';
export { default as equipmentService } from './equipmentService';
export { default as interventionService } from './interventionService';
export { default as dashboardService } from './dashboardService';
export { default as userService } from './userService';
export { default as roleService } from './roleService';
export { default as sectionService } from './sectionService';
export { default as permissionService } from './permissionService';

// Re-export all services as a single object
export const services = {
  auth: require('./authService').default,
  client: require('./clientService').default,
  equipment: require('./equipmentService').default,
  intervention: require('./interventionService').default,
  dashboard: require('./dashboardService').default,
  user: require('./userService').default,
  role: require('./roleService').default,
  section: require('./sectionService').default,
  permission: require('./permissionService').default
};