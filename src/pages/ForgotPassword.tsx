import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Phone, ArrowLeft, CheckCircle2, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

type Step = 'phone' | 'code' | 'reset' | 'success';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countdown, setCountdown] = useState(0);

  const sendCode = () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      toast.error('请输入正确的手机号');
      return;
    }
    toast.success('验证码已发送');
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setStep('code');
  };

  const verifyCode = () => {
    if (code.length !== 6) {
      toast.error('请输入6位验证码');
      return;
    }
    toast.success('验证码验证成功');
    setStep('reset');
  };

  const resetPassword = () => {
    if (password.length < 8) {
      toast.error('密码长度至少8位');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }
    toast.success('密码重置成功');
    setStep('success');
  };

  const steps = [
    { id: 'phone', label: '验证手机', icon: Phone },
    { id: 'code', label: '输入验证码', icon: Send },
    { id: 'reset', label: '重置密码', icon: KeyRound },
    { id: 'success', label: '完成', icon: CheckCircle2 },
  ];

  const currentIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <div className="container py-6">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-jade-600 hover:text-gold-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回登录
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-ink-gradient flex items-center justify-center mx-auto mb-4 border-2 border-gold-400">
              <KeyRound className="w-8 h-8 text-gold-300" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-jade-700 mb-2">找回密码</h1>
            <p className="text-jade-500">通过注册手机号验证身份，重置您的密码</p>
          </div>

          <div className="flex items-center justify-center mb-8">
            {steps.map((s, index) => {
              const Icon = s.icon;
              const isActive = index <= currentIndex;
              const isCurrent = index === currentIndex;
              return (
                <div key={s.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isActive
                          ? 'bg-ink-gradient border-gold-400 text-gold-300'
                          : 'bg-white border-gold-200 text-jade-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium ${
                        isCurrent ? 'text-gold-600' : isActive ? 'text-jade-600' : 'text-jade-300'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-12 md:w-16 h-0.5 mb-4 mx-1 ${
                        index < currentIndex ? 'bg-gold-400' : 'bg-gold-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <Card>
            <Card.Content>
              {step === 'phone' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-medium text-jade-700 mb-2">
                      注册手机号
                    </label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="请输入注册时使用的手机号"
                      leftIcon={<Phone className="w-4 h-4" />}
                    />
                  </div>
                  <Button className="w-full" size="lg" onClick={sendCode}>
                    发送验证码
                  </Button>
                </motion.div>
              )}

              {step === 'code' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-medium text-jade-700 mb-2">
                      验证码
                    </label>
                    <div className="flex gap-3">
                      <Input
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="请输入6位验证码"
                        className="flex-1"
                      />
                      <Button
                        variant="secondary"
                        onClick={sendCode}
                        disabled={countdown > 0}
                      >
                        {countdown > 0 ? `${countdown}s` : '重新发送'}
                      </Button>
                    </div>
                    <p className="mt-2 text-sm text-jade-500">
                      验证码已发送至 <span className="text-gold-600 font-medium">{phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</span>
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => setStep('phone')} className="flex-1">
                      上一步
                    </Button>
                    <Button className="flex-1" size="lg" onClick={verifyCode}>
                      验证
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 'reset' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-medium text-jade-700 mb-2">
                      新密码
                    </label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="请输入新密码（至少8位）"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-jade-700 mb-2">
                      确认新密码
                    </label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="请再次输入新密码"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => setStep('code')} className="flex-1">
                      上一步
                    </Button>
                    <Button className="flex-1" size="lg" onClick={resetPassword}>
                      确认重置
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <div className="w-20 h-20 rounded-full bg-jade-100 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-12 h-12 text-jade-500" />
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-jade-700 mb-2">
                    密码重置成功
                  </h2>
                  <p className="text-jade-500 mb-8">
                    您的密码已成功重置，请使用新密码登录
                  </p>
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => navigate('/')} className="flex-1">
                      返回首页
                    </Button>
                    <Button onClick={() => navigate('/login')} className="flex-1">
                      立即登录
                    </Button>
                  </div>
                </motion.div>
              )}
            </Card.Content>
          </Card>

          <div className="mt-6 text-center text-sm text-jade-500">
            还没有账号？{' '}
            <Link to="/register" className="text-gold-600 font-medium hover:text-gold-700">
              立即注册
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
