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
    
    body('section')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Section name cannot exceed 100 characters'),
    
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
    
    body('section')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Section name cannot exceed 100 characters'),
    
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
      .optional({ checkFalsy: true })
      .matches(/^$|^[0-9A-Za-z\s\-]{2,20}$/)
      .withMessage('Postal code must contain only letters, numbers, spaces or hyphens (2-20 chars)'),
    
    body('tel')
      .optional({ checkFalsy: true })
      .matches(/^$|^[\d\s\-\+\(\)\.]{8,20}$/)
      .withMessage('Phone number must contain 8-20 digits with optional formatting'),
    
    body('email')
      .optional({ checkFalsy: true })
      .normalizeEmail()
      .isEmail()
      .withMessage('Please provide a valid email address'),
    
    body('email_contact')
      .optional({ checkFalsy: true })
      .normalizeEmail()
      .isEmail()
      .withMessage('Please provide a valid contact email address'),
    
    body('siteWeb')
      .optional({ checkFalsy: true })
      .isURL({
        require_protocol: true,
        protocols: ['http', 'https']
      })
      .withMessage('Please provide a valid URL including http:// or https://')
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
      .optional({ checkFalsy: true })
      .normalizeEmail()
      .isEmail()
      .withMessage('Please provide a valid email address'),
    
    body('email_contact')
      .optional({ checkFalsy: true })
      .normalizeEmail()
      .isEmail()
      .withMessage('Please provide a valid contact email address')
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
  queryValidations,
  idValidation
};