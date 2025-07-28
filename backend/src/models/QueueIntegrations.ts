import {
    Table,
    Column,
    CreatedAt,
    UpdatedAt,
    Model,
    DataType,
    PrimaryKey,
    HasMany,
    AutoIncrement,
    BelongsTo,
    ForeignKey,
    Default
} from "sequelize-typescript";
import Queue from "./Queue";
import Company from "./Company";

@Table
class QueueIntegrations extends Model<QueueIntegrations> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @Column(DataType.TEXT)
    type: string;

    @Column(DataType.TEXT)
    name: string;
    
    @Column(DataType.TEXT)
    projectName: string;
    
    @Column(DataType.TEXT)
    jsonContent: string;

    @Column(DataType.TEXT)
    urlN8N: string;

    @Column(DataType.TEXT)
    language: string;

    @CreatedAt
    @Column(DataType.DATE(6))
    createdAt: Date;

    @UpdatedAt
    @Column(DataType.DATE(6))
    updatedAt: Date;

    @ForeignKey(() => Company)
    @Column
    companyId: number;
  
    @BelongsTo(() => Company)
    company: Company;
  
    @Column
    typebotSlug: string;

    @Default(0)
    @Column
    typebotExpires: number;

    @Column
    typebotKeywordFinish: string;

    @Column
    typebotUnknownMessage: string;

    @Default(1000)
    @Column
    typebotDelayMessage: number

    @Column
    typebotKeywordRestart: string;

    @Column
    typebotRestartMessage: string;
    
    @Column
    geminiApiKey: string;
    
    @Column(DataType.TEXT)
    geminiPrompt: string;
    
    @Default(1024)
    @Column
    geminiMaxTokens: number;
    
    @Default(0.7)
    @Column
    geminiTemperature: number;
    
    @Default(20)
    @Column
    geminiMaxMessages: number;
    
    @Column
    geminiTestPhone: string;
}

export default QueueIntegrations;