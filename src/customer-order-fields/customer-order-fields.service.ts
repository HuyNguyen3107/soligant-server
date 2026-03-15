import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdateCustomerOrderFieldsDto } from './dto/update-customer-order-fields.dto';
import {
  CustomerOrderFieldSelectType,
  CustomerOrderFieldType,
  CustomerOrderFieldsConfig,
  CustomerOrderFieldsConfigDocument,
} from './schemas/customer-order-fields.schema';

const DEFAULT_CONFIG_KEY = 'default';
const DEFAULT_TITLE = 'Thông tin khách hàng';

interface FieldOptionSource {
  label?: unknown;
  value?: unknown;
}

interface FieldSource {
  label?: unknown;
  fieldType?: unknown;
  placeholder?: unknown;
  required?: unknown;
  options?: unknown[];
  sortOrder?: unknown;
  selectType?: unknown;
}

interface ConfigSource {
  _id?: unknown;
  id?: unknown;
  key?: unknown;
  title?: unknown;
  description?: unknown;
  fields?: unknown[];
  isActive?: unknown;
  updatedAt?: unknown;
}

export interface CustomerOrderFieldOptionResponse {
  label: string;
  value: string;
}

export interface CustomerOrderFieldResponse {
  label: string;
  fieldType: CustomerOrderFieldType;
  placeholder: string;
  required: boolean;
  options: CustomerOrderFieldOptionResponse[];
  sortOrder: number;
  selectType?: CustomerOrderFieldSelectType;
}

export interface CustomerOrderFieldsConfigResponse {
  id: string;
  key: string;
  title: string;
  description: string;
  fields: CustomerOrderFieldResponse[];
  isActive: boolean;
  updatedAt: string;
}

@Injectable()
export class CustomerOrderFieldsService {
  constructor(
    @InjectModel(CustomerOrderFieldsConfig.name)
    private readonly customerOrderFieldsModel: Model<CustomerOrderFieldsConfigDocument>,
  ) {}

  async findAdminConfig(): Promise<CustomerOrderFieldsConfigResponse> {
    const config = (await this.customerOrderFieldsModel
      .findOne({ key: DEFAULT_CONFIG_KEY })
      .lean()
      .exec()) as ConfigSource | null;

    if (!config) {
      return this.mapConfig({
        key: DEFAULT_CONFIG_KEY,
        title: DEFAULT_TITLE,
        description: '',
        fields: [],
        isActive: true,
      });
    }

    return this.mapConfig(config);
  }

  async findPublicConfig(): Promise<CustomerOrderFieldsConfigResponse> {
    const config = await this.findAdminConfig();

    if (!config.isActive) {
      return {
        ...config,
        fields: [],
      };
    }

    return config;
  }

  async updateConfig(
    dto: UpdateCustomerOrderFieldsDto,
  ): Promise<CustomerOrderFieldsConfigResponse> {
    const normalizedTitle = normalizeTitle(dto.title);

    const updated = (await this.customerOrderFieldsModel
      .findOneAndUpdate(
        { key: DEFAULT_CONFIG_KEY },
        {
          $set: {
            title: normalizedTitle || DEFAULT_TITLE,
            description: normalizeRichText(dto.description),
            fields: this.normalizeFields(dto.fields ?? []),
            isActive: dto.isActive ?? true,
          },
          $setOnInsert: {
            key: DEFAULT_CONFIG_KEY,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
          lean: true,
        },
      )
      .exec()) as ConfigSource | null;

    return this.mapConfig(updated ?? {});
  }

  private mapConfig(source: ConfigSource): CustomerOrderFieldsConfigResponse {
    const fields = (Array.isArray(source.fields) ? source.fields : [])
      .map((field: unknown) => {
        const sourceField = field as FieldSource;
        const fieldType = normalizeFieldType(sourceField.fieldType);
        const selectType =
          fieldType === 'select'
            ? normalizeSelectType(sourceField.selectType)
            : undefined;

        const options =
          fieldType === 'select'
            ? (Array.isArray(sourceField.options) ? sourceField.options : [])
                .map((option: unknown) => {
                  const sourceOption = option as FieldOptionSource;
                  return {
                    label: String(sourceOption.label ?? ''),
                    value: String(sourceOption.value ?? ''),
                  };
                })
                .filter((option) => option.label && option.value)
            : [];

        return {
          label: String(sourceField.label ?? ''),
          fieldType,
          placeholder: String(sourceField.placeholder ?? ''),
          required: Boolean(sourceField.required),
          options,
          sortOrder: Number(sourceField.sortOrder ?? 0),
          selectType,
        } as CustomerOrderFieldResponse;
      })
      .sort((left, right) => left.sortOrder - right.sortOrder);

    return {
      id: String(source._id ?? source.id ?? ''),
      key: String(source.key ?? DEFAULT_CONFIG_KEY),
      title: String(source.title ?? DEFAULT_TITLE),
      description: String(source.description ?? ''),
      fields,
      isActive: Boolean(source.isActive ?? true),
      updatedAt: String(source.updatedAt ?? new Date().toISOString()),
    };
  }

  private normalizeFields(fields: UpdateCustomerOrderFieldsDto['fields']) {
    return (fields ?? []).map((field, index) => ({
      label: normalizeTitle(field.label),
      fieldType: normalizeFieldType(field.fieldType),
      placeholder: normalizeText(field.placeholder),
      required: field.required ?? false,
      options:
        field.fieldType === 'select'
          ? (field.options ?? [])
              .map((option) => ({
                label: normalizeTitle(option.label),
                value: normalizeTitle(option.value),
              }))
              .filter((option) => option.label && option.value)
          : [],
      selectType:
        field.fieldType === 'select'
          ? normalizeSelectType(field.selectType)
          : undefined,
      sortOrder: field.sortOrder ?? index,
    }));
  }
}

function normalizeFieldType(value: unknown): CustomerOrderFieldType {
  if (
    value === 'short_text' ||
    value === 'long_text' ||
    value === 'select' ||
    value === 'image_upload' ||
    value === 'number' ||
    value === 'date'
  ) {
    return value;
  }

  return 'short_text';
}

function normalizeSelectType(value: unknown): CustomerOrderFieldSelectType {
  if (value === 'dropdown' || value === 'radio' || value === 'checkbox') {
    return value;
  }

  return 'dropdown';
}

function normalizeTitle(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 200);
}

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 500);
}

function normalizeRichText(value: unknown): string {
  return String(value ?? '').trim().slice(0, 5000);
}
