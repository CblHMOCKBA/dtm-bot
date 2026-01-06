export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message?: string;
}

export interface ValidationRules {
  [key: string]: ValidationRule[];
}

export interface ValidationErrors {
  [key: string]: string;
}

export class FormValidator {
  private rules: ValidationRules;
  private errors: ValidationErrors = {};

  constructor(rules: ValidationRules) {
    this.rules = rules;
  }

  validate(data: Record<string, any>): { isValid: boolean; errors: ValidationErrors } {
    this.errors = {};

    for (const [field, fieldRules] of Object.entries(this.rules)) {
      const value = data[field];

      for (const rule of fieldRules) {
        const error = this.validateRule(field, value, rule);
        if (error) {
          this.errors[field] = error;
          break;
        }
      }
    }

    return {
      isValid: Object.keys(this.errors).length === 0,
      errors: this.errors,
    };
  }

  private validateRule(field: string, value: any, rule: ValidationRule): string | null {
    // Required - для чисел 0 это валидное значение!
    if (rule.required) {
      if (value === undefined || value === null) {
        return rule.message || 'Это поле обязательно для заполнения';
      }
      // Для строк проверяем пустоту
      if (typeof value === 'string' && value === '') {
        return rule.message || 'Это поле обязательно для заполнения';
      }
      // Для чисел НЕ проверяем на 0 - это валидное значение!
    }

    // Skip other validations if value is empty and not required
    if (value === undefined || value === null || value === '') {
      return null;
    }

    // Min value (for numbers)
    if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
      return rule.message || `Минимальное значение: ${rule.min}`;
    }

    // Max value (for numbers)
    if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
      return rule.message || `Максимальное значение: ${rule.max}`;
    }

    // Min length (for strings)
    if (rule.minLength !== undefined && typeof value === 'string' && value.length < rule.minLength) {
      return rule.message || `Минимальная длина: ${rule.minLength} символов`;
    }

    // Max length (for strings)
    if (rule.maxLength !== undefined && typeof value === 'string' && value.length > rule.maxLength) {
      return rule.message || `Максимальная длина: ${rule.maxLength} символов`;
    }

    // Pattern
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      return rule.message || 'Неверный формат';
    }

    // Custom validation
    if (rule.custom && !rule.custom(value)) {
      return rule.message || 'Значение не прошло валидацию';
    }

    return null;
  }

  getErrors(): ValidationErrors {
    return this.errors;
  }

  hasError(field: string): boolean {
    return !!this.errors[field];
  }

  getError(field: string): string | undefined {
    return this.errors[field];
  }
}

// Готовые валидаторы для автомобилей
export const carValidationRules: ValidationRules = {
  brand: [
    { required: true, message: 'Укажите марку автомобиля' },
    { minLength: 2, message: 'Марка должна содержать минимум 2 символа' },
    { maxLength: 50, message: 'Марка не может быть длиннее 50 символов' },
  ],
  model: [
    { required: true, message: 'Укажите модель автомобиля' },
    { minLength: 1, message: 'Модель должна содержать минимум 1 символ' },
    { maxLength: 50, message: 'Модель не может быть длиннее 50 символов' },
  ],
  year: [
    { required: true, message: 'Укажите год выпуска' },
    { min: 1900, message: 'Год выпуска должен быть не раньше 1900' },
    {
      max: new Date().getFullYear() + 1,
      message: `Год выпуска не может быть больше ${new Date().getFullYear() + 1}`,
    },
  ],
  price: [
    { required: true, message: 'Укажите цену' },
    { min: 0, message: 'Цена не может быть отрицательной' },
    { max: 1000000000, message: 'Цена слишком большая' },
  ],
  mileage: [
    { required: true, message: 'Укажите пробег' },
    { min: 0, message: 'Пробег не может быть отрицательным' },
    { max: 10000000, message: 'Пробег слишком большой' },
  ],
  description: [
    { maxLength: 2000, message: 'Описание не может быть длиннее 2000 символов' },
  ],
};

// Утилита для быстрой валидации
export function validateCarForm(formData: any): { isValid: boolean; errors: ValidationErrors } {
  const validator = new FormValidator(carValidationRules);
  return validator.validate(formData);
}
