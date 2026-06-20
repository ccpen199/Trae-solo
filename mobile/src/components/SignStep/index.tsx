import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import type { SignStep as SignStepType } from '@/types';
import styles from './index.module.scss';

interface SignStepsProps {
  steps: SignStepType[];
}

const SignSteps: React.FC<SignStepsProps> = ({ steps }) => {
  return (
    <View className={styles.wrapper}>
      {steps.map((step, idx) => (
        <View
          key={step.step}
          className={classnames(
            styles.step,
            step.status === 'completed' && styles.completed,
            step.status === 'current' && styles.current,
            step.status === 'error' && styles.error
          )}
        >
          <View className={styles.node}>
            {step.status === 'completed' ? (
              <Text className={styles.checkIcon}>✓</Text>
            ) : step.status === 'error' ? (
              <Text className={styles.errorIcon}>!</Text>
            ) : (
              <Text className={styles.stepNum}>{step.step}</Text>
            )}
          </View>
          {idx < steps.length - 1 && (
            <View className={classnames(
              styles.line,
              step.status === 'completed' && styles.lineDone
            )} />
          )}
          <View className={styles.label}>
            <Text className={styles.title}>{step.title}</Text>
            <Text className={styles.desc}>{step.description}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

export default SignSteps;
