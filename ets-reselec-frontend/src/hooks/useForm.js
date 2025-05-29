// Fix for missing react-hook-form in Login.jsx and Register.jsx
// src/hooks/useForm.js - Custom form hook to replace react-hook-form
import { useState, useCallback } from 'react';

export const useForm = (initialValues = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const register = useCallback((name, validation = {}) => {
    return {
      name,
      value: values[name] || '',
      onChange: (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setValues(prev => ({ ...prev, [name]: value }));
        
        // Clear error when field changes
        if (errors[name]) {
          setErrors(prev => ({ ...prev, [name]: null }));
        }
      },
      onBlur: () => {
        // Validate field on blur if validation rules exist
        if (validation.required && !values[name]) {
          setErrors(prev => ({ 
            ...prev, 
            [name]: { message: validation.required === true ? `${name} is required` : validation.required }
          }));
        }
      }
    };
  }, [values, errors]);

  const handleSubmit = useCallback((onSubmit) => {
    return async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    };
  }, [values]);

  const setError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const watch = useCallback((name) => {
    return values[name];
  }, [values]);

  const reset = useCallback((newValues = {}) => {
    setValues(newValues);
    setErrors({});
    setIsSubmitting(false);
  }, []);

  return {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    watch,
    reset,
    values
  };
};

// Updated Login.jsx with fixed imports
// Replace the useForm import in Login.jsx with:
// import { useForm } from '../hooks/useForm';

// Updated Register.jsx with fixed imports  
// Replace the useForm import in Register.jsx with:
// import { useForm } from '../hooks/useForm';

// Fix for Profile.jsx - same replacement needed
// Replace the useForm import in Profile.jsx with:
// import { useForm } from '../hooks/useForm';

// Missing hooks export file
// src/hooks/usePermissions.js
export const usePermissions = () => {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => roleService.getPermissions().then(res => res.data.data),
    staleTime: 600000 // 10 minutes
  });
};

// Update AuthContext to include missing methods
// Add these methods to the AuthContext.jsx value object:

// updateProfile: async (profileData) => {
//   try {
//     const updatedUser = await authService.updateProfile(profileData);
//     dispatch({
//       type: AUTH_ACTIONS.UPDATE_USER,
//       payload: updatedUser
//     });
//     return { success: true };
//   } catch (error) {
//     return { success: false, error: error.message };
//   }
// },

// changePassword: async (passwordData) => {
//   try {
//     await authService.changePassword(passwordData);
//     return { success: true };
//   } catch (error) {
//     return { success: false, error: error.message };
//   }
// }

// Fix for missing form validation in components
// src/utils/validation.js
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const validateRequired = (value) => {
  return value && value.toString().trim().length > 0;
};

export const validateMinLength = (value, minLength) => {
  return value && value.toString().length >= minLength;
};

export const validateMaxLength = (value, maxLength) => {
  return !value || value.toString().length <= maxLength;
};

export const validatePhoneNumber = (phone) => {
  const re = /^[\d\s\-\+\(\)\.]{8,20}$/;
  return !phone || re.test(phone);
};

// Enhanced validation for forms
export const createValidator = (rules) => {
  return (values) => {
    const errors = {};
    
    Object.keys(rules).forEach(field => {
      const fieldRules = rules[field];
      const value = values[field];
      
      if (fieldRules.required && !validateRequired(value)) {
        errors[field] = { message: fieldRules.required === true ? `${field} is required` : fieldRules.required };
        return;
      }
      
      if (fieldRules.email && value && !validateEmail(value)) {
        errors[field] = { message: 'Invalid email format' };
        return;
      }
      
      if (fieldRules.minLength && value && !validateMinLength(value, fieldRules.minLength.value)) {
        errors[field] = { message: fieldRules.minLength.message || `Minimum ${fieldRules.minLength.value} characters` };
        return;
      }
      
      if (fieldRules.maxLength && value && !validateMaxLength(value, fieldRules.maxLength.value)) {
        errors[field] = { message: fieldRules.maxLength.message || `Maximum ${fieldRules.maxLength.value} characters` };
        return;
      }
      
      if (fieldRules.pattern && value && !fieldRules.pattern.value.test(value)) {
        errors[field] = { message: fieldRules.pattern.message || 'Invalid format' };
        return;
      }
      
      if (fieldRules.validate && value) {
        const customValidation = fieldRules.validate(value);
        if (customValidation !== true) {
          errors[field] = { message: customValidation };
          return;
        }
      }
    });
    
    return errors;
  };
};