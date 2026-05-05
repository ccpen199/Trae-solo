const GENDER_VALUES = ['male', 'female', 'other'];

const validateRegistration = (data) => {
  const errors = [];
  
  if (!data.username || data.username.trim() === '') {
    errors.push('用户名不能为空');
  } else if (data.username.length < 3 || data.username.length > 20) {
    errors.push('用户名长度必须在3-20个字符之间');
  }
  
  if (!data.password || data.password === '') {
    errors.push('密码不能为空');
  } else if (data.password.length < 6) {
    errors.push('密码长度不能少于6个字符');
  }
  
  if (!data.confirmPassword || data.confirmPassword === '') {
    errors.push('确认密码不能为空');
  } else if (data.password !== data.confirmPassword) {
    errors.push('两次输入的密码不一致');
  }
  
  if (data.age !== undefined && data.age !== null && data.age !== '') {
    const age = parseInt(data.age);
    if (isNaN(age) || age < 1 || age > 150) {
      errors.push('年龄必须在1-150之间');
    }
  }
  
  if (data.gender && data.gender !== '') {
    if (!GENDER_VALUES.includes(data.gender)) {
      errors.push('性别值无效，可选值：male, female, other');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateLogin = (data) => {
  const errors = [];
  
  if (!data.username || data.username.trim() === '') {
    errors.push('用户名不能为空');
  }
  
  if (!data.password || data.password === '') {
    errors.push('密码不能为空');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateUpdateProfile = (data, isPasswordUpdate = false) => {
  const errors = [];
  const fieldErrors = {};
  
  if (isPasswordUpdate) {
    if (data.password && data.password !== '') {
      if (data.password.length < 6) {
        errors.push('新密码长度不能少于6个字符');
        fieldErrors.password = '新密码长度不能少于6个字符';
      }
      if (!data.confirmPassword || data.confirmPassword === '') {
        errors.push('确认密码不能为空');
        fieldErrors.confirmPassword = '确认密码不能为空';
      } else if (data.password !== data.confirmPassword) {
        errors.push('两次输入的密码不一致');
        fieldErrors.confirmPassword = '两次输入的密码不一致';
      }
    }
  }
  
  if (data.age !== undefined && data.age !== null && data.age !== '') {
    const age = parseInt(data.age);
    if (isNaN(age) || age < 1 || age > 150) {
      errors.push('年龄必须在1-150之间');
      fieldErrors.age = '年龄必须在1-150之间';
    }
  }
  
  if (data.gender !== undefined && data.gender !== null && data.gender !== '') {
    if (!GENDER_VALUES.includes(data.gender)) {
      errors.push('性别值无效，可选值：male, female, other');
      fieldErrors.gender = '性别值无效，可选值：male, female, other';
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    fieldErrors
  };
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateUpdateProfile,
  GENDER_VALUES
};
