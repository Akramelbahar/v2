// ets-reselec-backend/middleware/validation.js (updated portions)
const { body, param, query } = require('express-validator');

// Authentication validations
const authValidations = {
  register: [
    body('nom')
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    
    body('username')
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Username must be between 3 and 100 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
      .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one letter and one number'),
    
    // Changed from 'section' to 'section_id'
    body('section_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Section ID must be a positive integer'),
    
    body('role_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Role ID must be a positive integer')
  ],

  login: [
    body('username')
      .notEmpty()
      .withMessage('Username is required'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  updateProfile: [
    body('nom')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    
    // Changed from 'section' to 'section_id'
    body('section_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Section ID must be a positive integer'),
    
    body('currentPassword')
      .optional()
      .notEmpty()
      .withMessage('Current password is required when changing password'),
    
    body('newPassword')
      .optional()
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters')
      .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one letter and one number')
  ]
};

// ... rest of the validation remains the same ...
// Client validations
const clientValidations = {
  create: [
    body('nom_entreprise')
      .notEmpty()
      .withMessage('Company name is required')
      .isLength({ min: 2, max: 255 })
      .withMessage('Company name must be between 2 and 255 characters'),
    
    body('secteur_activite')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Business sector cannot exceed 255 characters'),
    
    body('adresse')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Address cannot exceed 255 characters'),
    
    body('ville')
      .optional()
      .isLength({ max: 100 })
      .withMessage('City cannot exceed 100 characters'),
    
    body('codePostal')
      .optional()
      .matches(/^[0-9A-Za-z\s\-]{2,20}$/)
      .withMessage('Invalid postal code format'),
    
    body('tel')
      .optional()
      .matches(/^[\d\s\-\+\(\)\.]{8,20}$/)
      .withMessage('Invalid phone number format'),
    
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('email_contact')
      .optional()
      .isEmail()
      .withMessage('Invalid contact email format')
      .normalizeEmail(),
    
    body('siteWeb')
      .optional()
      .isURL()
      .withMessage('Invalid website URL format')
  ],

  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid client ID'),
    
    body('nom_entreprise')
      .optional()
      .notEmpty()
      .withMessage('Company name cannot be empty')
      .isLength({ min: 2, max: 255 })
      .withMessage('Company name must be between 2 and 255 characters'),
    
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('email_contact')
      .optional()
      .isEmail()
      .withMessage('Invalid contact email format')
      .normalizeEmail()
  ],

  delete: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid client ID')
  ]
};

// Equipment validations
const equipmentValidations = {
  create: [
    body('nom')
      .notEmpty()
      .withMessage('Equipment name is required')
      .isLength({ min: 2, max: 255 })
      .withMessage('Equipment name must be between 2 and 255 characters'),
    
    body('marque')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Brand cannot exceed 100 characters'),
    
    body('modele')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Model cannot exceed 100 characters'),
    
    body('type_equipement')
      .optional()
      .isIn([
        'MOTEUR_ELECTRIQUE',
        'TRANSFORMATEUR', 
        'GENERATEUR',
        'POMPE_INDUSTRIELLE',
        'VENTILATEUR',
        'COMPRESSEUR',
        'AUTOMATE',
        'TABLEAU_ELECTRIQUE'
      ])
      .withMessage('Invalid equipment type'),
    
    body('cout')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Cost must be a positive number'),
    
    body('proprietaire_id')
      .notEmpty()
      .withMessage('Owner is required')
      .isInt({ min: 1 })
      .withMessage('Invalid owner ID')
  ],

  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid equipment ID'),
    
    body('nom')
      .optional()
      .notEmpty()
      .withMessage('Equipment name cannot be empty')
      .isLength({ min: 2, max: 255 })
      .withMessage('Equipment name must be between 2 and 255 characters'),
    
    body('cout')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Cost must be a positive number'),
    
    body('proprietaire_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Invalid owner ID')
  ],

  delete: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid equipment ID')
  ]
};

// Intervention validations
const interventionValidations = {
  create: [
    body('date')
      .notEmpty()
      .withMessage('Date is required')
      .isISO8601()
      .withMessage('Invalid date format (use YYYY-MM-DD)')
      .toDate(),
    
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    
    body('statut')
      .optional()
      .isIn([
        'PLANIFIEE',
        'EN_ATTENTE_PDR', 
        'EN_COURS',
        'EN_PAUSE',
        'TERMINEE',
        'ANNULEE',
        'ECHEC'
      ])
      .withMessage('Invalid intervention status'),
    
    body('urgence')
      .optional()
      .isBoolean()
      .withMessage('Urgency must be true or false'),
    
    body('equipement_id')
      .notEmpty()
      .withMessage('Equipment is required')
      .isInt({ min: 1 })
      .withMessage('Invalid equipment ID')
  ],

  updateStatus: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid intervention ID'),
    
    body('statut')
      .notEmpty()
      .withMessage('Status is required')
      .isIn([
        'PLANIFIEE',
        'EN_ATTENTE_PDR',
        'EN_COURS', 
        'EN_PAUSE',
        'TERMINEE',
        'ANNULEE',
        'ECHEC'
      ])
      .withMessage('Invalid intervention status')
  ],

  diagnostic: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid intervention ID'),
    
    body('travailRequis')
      .optional()
      .isArray()
      .withMessage('Work required must be an array'),
    
    body('travailRequis.*')
      .optional()
      .isLength({ min: 1, max: 255 })
      .withMessage('Each work item must be between 1 and 255 characters'),
    
    body('besoinPDR')
      .optional()
      .isArray()
      .withMessage('PDR needs must be an array'),
    
    body('chargesRealisees')
      .optional()
      .isArray()
      .withMessage('Completed charges must be an array')
  ],

  planification: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid intervention ID'),
    
    body('capaciteExecution')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Execution capacity must be a positive integer'),
    
    body('urgencePrise')
      .optional()
      .isBoolean()
      .withMessage('Urgency handled must be true or false'),
    
    body('disponibilitePDR')
      .optional()
      .isBoolean()
      .withMessage('PDR availability must be true or false')
  ],

  controleQualite: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid intervention ID'),
    
    body('resultatsEssais')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('Test results cannot exceed 2000 characters'),
    
    body('analyseVibratoire')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('Vibratory analysis cannot exceed 2000 characters')
  ]
};

// Role validations
const roleValidations = {
  create: [
    body('nom')
      .notEmpty()
      .withMessage('Role name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Role name must be between 2 and 100 characters')
      .matches(/^[a-zA-ZÀ-ÿ0-9\s\-_]+$/)
      .withMessage('Role name can only contain letters, numbers, spaces, hyphens and underscores'),
    
    body('permissions')
      .optional()
      .isArray()
      .withMessage('Permissions must be an array'),
    
    body('permissions.*')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Each permission must be a valid ID')
  ],

  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid role ID'),
    
    body('nom')
      .optional()
      .notEmpty()
      .withMessage('Role name cannot be empty')
      .isLength({ min: 2, max: 100 })
      .withMessage('Role name must be between 2 and 100 characters')
      .matches(/^[a-zA-ZÀ-ÿ0-9\s\-_]+$/)
      .withMessage('Role name can only contain letters, numbers, spaces, hyphens and underscores'),
    
    body('permissions')
      .optional()
      .isArray()
      .withMessage('Permissions must be an array'),
    
    body('permissions.*')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Each permission must be a valid ID')
  ],

  assignPermissions: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid role ID'),
    
    body('permissions')
      .isArray()
      .withMessage('Permissions must be an array'),
    
    body('permissions.*')
      .isInt({ min: 1 })
      .withMessage('Each permission must be a valid ID')
  ]
};

// Permission validations
const permissionValidations = {
  create: [
    body('module')
      .notEmpty()
      .withMessage('Module is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Module must be between 2 and 100 characters')
      .matches(/^[a-zA-Z_]+$/)
      .withMessage('Module can only contain letters and underscores'),
    
    body('action')
      .notEmpty()
      .withMessage('Action is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Action must be between 2 and 100 characters')
      .matches(/^[a-zA-Z_]+$/)
      .withMessage('Action can only contain letters and underscores'),
    
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters')
  ],

  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid permission ID'),
    
    body('module')
      .optional()
      .notEmpty()
      .withMessage('Module cannot be empty')
      .isLength({ min: 2, max: 100 })
      .withMessage('Module must be between 2 and 100 characters')
      .matches(/^[a-zA-Z_]+$/)
      .withMessage('Module can only contain letters and underscores'),
    
    body('action')
      .optional()
      .notEmpty()
      .withMessage('Action cannot be empty')
      .isLength({ min: 2, max: 100 })
      .withMessage('Action must be between 2 and 100 characters')
      .matches(/^[a-zA-Z_]+$/)
      .withMessage('Action can only contain letters and underscores'),
    
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters')
  ]
};

// Query parameter validations
const queryValidations = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('sortBy')
      .optional()
      .isAlpha()
      .withMessage('Sort field must contain only letters'),
    
    query('sortOrder')
      .optional()
      .isIn(['ASC', 'DESC'])
      .withMessage('Sort order must be ASC or DESC')
  ],

  dateRange: [
    query('dateFrom')
      .optional()
      .isISO8601()
      .withMessage('Invalid from date format (use YYYY-MM-DD)')
      .toDate(),
    
    query('dateTo')
      .optional()
      .isISO8601()
      .withMessage('Invalid to date format (use YYYY-MM-DD)')
      .toDate()
  ]
};

// ID parameter validation
const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid ID parameter')
];

module.exports = {
  authValidations,
  clientValidations,
  equipmentValidations,
  interventionValidations,
  roleValidations,
  permissionValidations,
  queryValidations,
  idValidation
};