import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  AutoIncrement,
  DataType
} from "sequelize-typescript";

import Company from "./Company";
import User from "./User";

@Table
class QuickMessage extends Model<QuickMessage> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  shortcode: string;

  @Column
  message: string;

  @Column
  get mediaPath(): string | null {
    if (this.getDataValue("mediaPath")) {
      
      return `${process.env.BACKEND_URL}${process.env.PROXY_PORT ?`:${process.env.PROXY_PORT}`:""}/public/company${this.companyId}/quickMessage/${this.getDataValue("mediaPath")}`;

    }
    return null;
  }
  
  @Column
  mediaName: string;

  @Column
  geral: boolean;
  
  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => Company)
  company: Company;

  @BelongsTo(() => User)
  user: User;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @Column
  visao: boolean;

  // Novos campos para organização
  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null
  })
  folder: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null
  })
  subfolder: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: null
  })
  contactData: any; // Para armazenar dados do contato a ser enviado

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false
  })
  isContact: boolean; // Indica se é uma mensagem de contato

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null
  })
  contactName: string; // Nome do contato

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null
  })
  contactNumber: string; // Número do contato

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null
  })
  contactEmail: string; // Email do contato

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null
  })
  tags: string; // Tags para categorização

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0
  })
  usageCount: number; // Contador de uso da mensagem rápida

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null
  })
  lastUsed: Date; // Data do último uso
}

export default QuickMessage;
