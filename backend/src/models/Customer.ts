import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { ICustomer } from '../types';

interface CustomerCreationAttributes extends Optional<ICustomer, 'id' | 'createdAt' | 'updatedAt' | 'email' | 'phone' | 'address'> {}

class Customer extends Model<ICustomer, CustomerCreationAttributes> implements ICustomer {
  public id!: number;
  public name!: string;
  public company!: string;
  public phone!: string;
  public email!: string;
  public address!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Customer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    company: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'customers',
    timestamps: true,
    underscored: true
  }
);

export default Customer;
