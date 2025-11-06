const { sequelize } = require('../config/database');
const User = require('./user.model');
const RegisterRequest = require('./registerRequest.model');
const Property = require('./property.model');
const PropertyManager = require('./propertyManager.model');
const City = require('./city.model');
const ProblemOption = require('./problemOption.model');
const PropertyProblemOption = require('./propertyProblemOption.model');
const Report = require('./report.model');
const Complaint = require('./complaint.model');
const Suggestion = require('./suggestion.model');
const TenantPayment = require('./tenantPayment.model');
const SpendingConfig = require('./spendingConfig.model');
const PropertySpendingConfig = require('./propertySpendingConfig.model');
const MonthlyReport = require('./monthlyReport.model');
const PushToken = require('./pushToken.model');

const db = {};

db.sequelize = sequelize;
db.User = User;
db.RegisterRequest = RegisterRequest;
db.Property = Property;
db.PropertyManager = PropertyManager;
db.City = City;
db.ProblemOption = ProblemOption;
db.PropertyProblemOption = PropertyProblemOption;
db.Report = Report;
db.Complaint = Complaint;
db.Suggestion = Suggestion;
db.TenantPayment = TenantPayment;
db.SpendingConfig = SpendingConfig;
db.PropertySpendingConfig = PropertySpendingConfig;
db.MonthlyReport = MonthlyReport;
db.PushToken = PushToken;

// Define relationships
// Property belongs to User (property manager) - DEPRECATED, kept for backward compatibility
Property.belongsTo(User, {
  foreignKey: 'property_manager_user_id',
  as: 'manager'
});

// User has many Properties - DEPRECATED
User.hasMany(Property, {
  foreignKey: 'property_manager_user_id',
  as: 'managedProperties'
});

// Many-to-Many: Property has many Managers (Users) through PropertyManager
Property.belongsToMany(User, {
  through: PropertyManager,
  foreignKey: 'property_id',
  otherKey: 'user_id',
  as: 'managers'
});

// Many-to-Many: User (manager) has many Properties through PropertyManager
User.belongsToMany(Property, {
  through: PropertyManager,
  foreignKey: 'user_id',
  otherKey: 'property_id',
  as: 'managedPropertiesMany'
});

// City relationship with Property
Property.belongsTo(City, {
  foreignKey: 'city_id',
  as: 'cityDetails'
});

City.hasMany(Property, {
  foreignKey: 'city_id',
  as: 'properties'
});

// ProblemOption belongs to User (creator)
ProblemOption.belongsTo(User, {
  foreignKey: 'created_by_user_id',
  as: 'creator'
});

User.hasMany(ProblemOption, {
  foreignKey: 'created_by_user_id',
  as: 'createdProblemOptions'
});

// Many-to-Many: Property has many ProblemOptions through PropertyProblemOption
Property.belongsToMany(ProblemOption, {
  through: PropertyProblemOption,
  foreignKey: 'property_id',
  otherKey: 'problem_option_id',
  as: 'problemOptions'
});

// Many-to-Many: ProblemOption belongs to many Properties through PropertyProblemOption
ProblemOption.belongsToMany(Property, {
  through: PropertyProblemOption,
  foreignKey: 'problem_option_id',
  otherKey: 'property_id',
  as: 'properties'
});

// Report relationships
Report.belongsTo(User, {
  foreignKey: 'tenant_user_id',
  as: 'tenant'
});

Report.belongsTo(Property, {
  foreignKey: 'property_id',
  as: 'property'
});

Report.belongsTo(ProblemOption, {
  foreignKey: 'problem_option_id',
  as: 'problemOption'
});

User.hasMany(Report, {
  foreignKey: 'tenant_user_id',
  as: 'reports'
});

Property.hasMany(Report, {
  foreignKey: 'property_id',
  as: 'reports'
});

ProblemOption.hasMany(Report, {
  foreignKey: 'problem_option_id',
  as: 'reports'
});

// Complaint relationships
Complaint.belongsTo(User, {
  foreignKey: 'tenant_user_id',
  as: 'tenant'
});

Complaint.belongsTo(Property, {
  foreignKey: 'property_id',
  as: 'property'
});

User.hasMany(Complaint, {
  foreignKey: 'tenant_user_id',
  as: 'complaints'
});

Property.hasMany(Complaint, {
  foreignKey: 'property_id',
  as: 'complaints'
});

// Suggestion relationships
Suggestion.belongsTo(User, {
  foreignKey: 'tenant_user_id',
  as: 'tenant'
});

Suggestion.belongsTo(Property, {
  foreignKey: 'property_id',
  as: 'property'
});

User.hasMany(Suggestion, {
  foreignKey: 'tenant_user_id',
  as: 'suggestions'
});

Property.hasMany(Suggestion, {
  foreignKey: 'property_id',
  as: 'suggestions'
});

// TenantPayment relationships
TenantPayment.belongsTo(User, {
  foreignKey: 'tenant_id',
  as: 'tenant'
});

TenantPayment.belongsTo(Property, {
  foreignKey: 'property_id',
  as: 'property'
});

User.hasMany(TenantPayment, {
  foreignKey: 'tenant_id',
  as: 'payments'
});

Property.hasMany(TenantPayment, {
  foreignKey: 'property_id',
  as: 'payments'
});

// SpendingConfig belongs to User (creator)
SpendingConfig.belongsTo(User, {
  foreignKey: 'created_by_user_id',
  as: 'creator'
});

User.hasMany(SpendingConfig, {
  foreignKey: 'created_by_user_id',
  as: 'createdSpendingConfigs'
});

// Many-to-Many: Property has many SpendingConfigs through PropertySpendingConfig
Property.belongsToMany(SpendingConfig, {
  through: PropertySpendingConfig,
  foreignKey: 'property_id',
  otherKey: 'spending_config_id',
  as: 'spendingConfigs'
});

// Many-to-Many: SpendingConfig belongs to many Properties through PropertySpendingConfig
SpendingConfig.belongsToMany(Property, {
  through: PropertySpendingConfig,
  foreignKey: 'spending_config_id',
  otherKey: 'property_id',
  as: 'properties'
});

// MonthlyReport relationships
MonthlyReport.belongsTo(Property, {
  foreignKey: 'property_id',
  as: 'property'
});

Property.hasMany(MonthlyReport, {
  foreignKey: 'property_id',
  as: 'monthlyReports'
});

// PushToken relationships
PushToken.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

User.hasMany(PushToken, {
  foreignKey: 'user_id',
  as: 'pushTokens'
});

module.exports = db;
