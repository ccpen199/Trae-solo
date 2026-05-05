import sequelize from '../config/database';
import User from './User';
import Department from './Department';
import DailyLog from './DailyLog';
import Project from './Project';
import Customer from './Customer';
import Task from './Task';
import Evaluation from './Evaluation';
import ProjectFeedback from './ProjectFeedback';
import Reminder from './Reminder';
import ProjectMessage from './ProjectMessage';
import MissingLogRecord from './MissingLogRecord';

Department.hasMany(User, { foreignKey: 'department_id', as: 'employees' });
User.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

Department.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });

User.hasMany(DailyLog, { foreignKey: 'user_id', as: 'dailyLogs' });
DailyLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Project, { foreignKey: 'manager_id', as: 'managedProjects' });
Project.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });

Project.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Project, { foreignKey: 'customer_id', as: 'projects' });

Project.hasMany(Task, { foreignKey: 'project_id', as: 'tasks' });
Task.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
Task.belongsTo(User, { foreignKey: 'assignee_id', as: 'assignee' });

DailyLog.hasMany(Evaluation, { foreignKey: 'daily_log_id', as: 'evaluations' });
Evaluation.belongsTo(DailyLog, { foreignKey: 'daily_log_id', as: 'dailyLog' });
Evaluation.belongsTo(User, { foreignKey: 'evaluator_id', as: 'evaluator' });

DailyLog.hasMany(ProjectFeedback, { foreignKey: 'daily_log_id', as: 'projectFeedbacks' });
ProjectFeedback.belongsTo(DailyLog, { foreignKey: 'daily_log_id', as: 'dailyLog' });
ProjectFeedback.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
ProjectFeedback.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

DailyLog.hasMany(Reminder, { foreignKey: 'daily_log_id', as: 'reminders' });
Reminder.belongsTo(DailyLog, { foreignKey: 'daily_log_id', as: 'dailyLog' });
Reminder.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Project.hasMany(ProjectMessage, { foreignKey: 'project_id', as: 'messages' });
ProjectMessage.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
ProjectMessage.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
ProjectMessage.hasMany(ProjectMessage, { foreignKey: 'parent_message_id', as: 'replies' });
ProjectMessage.belongsTo(ProjectMessage, { foreignKey: 'parent_message_id', as: 'parent' });

User.hasMany(MissingLogRecord, { foreignKey: 'user_id', as: 'missingLogs' });
MissingLogRecord.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export {
  sequelize,
  User,
  Department,
  DailyLog,
  Project,
  Customer,
  Task,
  Evaluation,
  ProjectFeedback,
  Reminder,
  ProjectMessage,
  MissingLogRecord
};
