import { useState, useCallback } from 'react';

const RULES = {
  required: (v) => (!v && v !== 0 ? 'Campo obligatorio' : null),
  email: (v) => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Email invalido' : null),
  minLength: (min) => (v) => (v && v.length < min ? `Minimo ${min} caracteres` : null),
  maxLength: (max) => (v) => (v && v.length > max ? `Maximo ${max} caracteres` : null),
  phone: (v) => (v && !/^(\+51)?[9]\d{8}$/.test(v.replace(/\s/g, '')) ? 'Telefono invalido (ej: 912345678)' : null),
  password: (v) => {
    if (!v) return 'Campo obligatorio';
    if (v.length < 8) return 'Minimo 8 caracteres';
    if (!/[A-Z]/.test(v)) return 'Debe contener al menos una mayuscula';
    if (!/\d/.test(v)) return 'Debe contener al menos un numero';
    return null;
  },
  match: (field, label) => (v, form) => (v !== form[field] ? `No coincide con ${label}` : null),
  min: (min) => (v) => (v !== '' && Number(v) < min ? `Minimo ${min}` : null),
  max: (max) => (v) => (v !== '' && Number(v) > max ? `Maximo ${max}` : null),
};

export function useFormValidation(validationSchema) {
  const [errors, setErrors] = useState({});

  const validateField = useCallback((name, value, formValues = {}) => {
    const fieldRules = validationSchema[name];
    if (!fieldRules) return null;

    for (const rule of fieldRules) {
      const ruleFn = typeof rule === 'string' ? RULES[rule] : rule;
      const error = ruleFn(value, formValues);
      if (error) return error;
    }
    return null;
  }, [validationSchema]);

  const validateAll = useCallback((formValues) => {
    const newErrors = {};
    let isValid = true;

    for (const [name, rules] of Object.entries(validationSchema)) {
      const error = validateField(name, formValues[name], formValues);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [validationSchema, validateField]);

  const clearErrors = useCallback(() => setErrors({}), []);

  const setFieldError = useCallback((name, message) => {
    setErrors(prev => ({ ...prev, [name]: message }));
  }, []);

  return { errors, validateField, validateAll, clearErrors, setFieldError };
}

// Export rules for external use in schemas
useFormValidation.rules = RULES;
