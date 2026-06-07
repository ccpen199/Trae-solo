import { useState } from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle, Globe, Clock, FileCheck, Search } from 'lucide-react';
import { apiFetch, formatDateTime } from '@/lib/api';
import { useI18nStore } from '@/store/i18n';
import { useAuthStore } from '@/store/auth';

interface VerificationResult {
  valid: boolean;
  message: string;
  details?: any;
}

export default function Compliance() {
  const [arbnInput, setArbnInput] = useState('');
  const [arbnResult, setArbnResult] = useState<VerificationResult | null>(null);
  const [tfnInput, setTfnInput] = useState('');
  const [tfnResult, setTfnResult] = useState<VerificationResult | null>(null);
  const [timezoneFrom, setTimezoneFrom] = useState('UTC');
  const [timezoneTo, setTimezoneTo] = useState('Australia/Sydney');
  const [sourceTime, setSourceTime] = useState('2024-12-31T23:59:00');
  const [convertedTime, setConvertedTime] = useState<string | null>(null);
  const [timezones, setTimezones] = useState<string[]>([]);
  const [clauses, setClauses] = useState<any[]>([]);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('verification');
  const { t } = useI18nStore();
  const { user } = useAuthStore();

  const loadLeaseClauses = async () => {
    try {
      const res = await apiFetch<{ data: any[] }>('/compliance/lease-clauses');
      setClauses(res.data);
    } catch (error) {
      console.error('Failed to load clauses:', error);
    }
  };

  const loadChecklist = async (type: string) => {
    try {
      const res = await apiFetch<{ data: any[] }>(`/compliance/checklist?type=${type}`);
      setChecklist(res.data);
    } catch (error) {
      console.error('Failed to load checklist:', error);
    }
  };

  const loadTimezones = async () => {
    try {
      const res = await apiFetch<{ data: string[] }>('/compliance/timezones');
      setTimezones(res.data);
    } catch (error) {
      console.error('Failed to load timezones:', error);
    }
  };

  const verifyArbn = async () => {
    try {
      const res = await apiFetch<VerificationResult>('/compliance/verify-arbn', {
        method: 'POST',
        body: JSON.stringify({ arbn: arbnInput }),
      });
      setArbnResult(res);
    } catch (error: any) {
      setArbnResult({ valid: false, message: error.message });
    }
  };

  const verifyTfn = async () => {
    try {
      const res = await apiFetch<VerificationResult>('/compliance/verify-tfn', {
        method: 'POST',
        body: JSON.stringify({ tfn: tfnInput }),
      });
      setTfnResult(res);
    } catch (error: any) {
      setTfnResult({ valid: false, message: error.message });
    }
  };

  const convertTimezone = async () => {
    try {
      const res = await apiFetch<{ data: { converted_time: string } }>('/compliance/timezone/convert', {
        method: 'POST',
        body: JSON.stringify({
          source_time: sourceTime,
          from_timezone: timezoneFrom,
          to_timezone: timezoneTo,
        }),
      });
      setConvertedTime(res.data.converted_time);
    } catch (error) {
      console.error('Failed to convert timezone:', error);
    }
  };

  useState(() => {
    loadTimezones();
    loadLeaseClauses();
    loadChecklist('lease_start');
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('compliance', 'compliance')}</h1>
        <div className="flex items-center space-x-2">
          <Shield size={24} className="text-blue-600" />
        </div>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'verification', label: t('id_verification', 'compliance') },
          { key: 'lease_clauses', label: t('lease_clauses', 'compliance') },
          { key: 'checklist', label: t('compliance_checklist', 'compliance') },
          { key: 'timezone', label: t('timezone_converter', 'compliance') },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'verification' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FileCheck size={20} className="mr-2 text-blue-600" />
              {t('arbn_verification', 'compliance')}
            </h3>
            <p className="text-sm text-gray-500 mb-4">{t('arbn_description', 'compliance')}</p>
            <div className="flex space-x-3">
              <input
                type="text"
                placeholder="e.g., 123456789"
                value={arbnInput}
                onChange={(e) => setArbnInput(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <button
                onClick={verifyArbn}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {t('verify', 'compliance')}
              </button>
            </div>
            {arbnResult && (
              <div className={`mt-4 p-4 rounded-lg flex items-start space-x-3 ${
                arbnResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                {arbnResult.valid ? (
                  <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${arbnResult.valid ? 'text-green-800' : 'text-red-800'}`}>
                    {arbnResult.valid ? t('valid', 'compliance') : t('invalid', 'compliance')}
                  </p>
                  <p className={`text-sm ${arbnResult.valid ? 'text-green-600' : 'text-red-600'}`}>
                    {arbnResult.message}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FileCheck size={20} className="mr-2 text-purple-600" />
              {t('tfn_verification', 'compliance')}
            </h3>
            <p className="text-sm text-gray-500 mb-4">{t('tfn_description', 'compliance')}</p>
            <div className="flex space-x-3">
              <input
                type="text"
                placeholder="e.g., 123456789"
                value={tfnInput}
                onChange={(e) => setTfnInput(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <button
                onClick={verifyTfn}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                {t('verify', 'compliance')}
              </button>
            </div>
            {tfnResult && (
              <div className={`mt-4 p-4 rounded-lg flex items-start space-x-3 ${
                tfnResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                {tfnResult.valid ? (
                  <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${tfnResult.valid ? 'text-green-800' : 'text-red-800'}`}>
                    {tfnResult.valid ? t('valid', 'compliance') : t('invalid', 'compliance')}
                  </p>
                  <p className={`text-sm ${tfnResult.valid ? 'text-green-600' : 'text-red-600'}`}>
                    {tfnResult.message}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'lease_clauses' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('nsw_lease_clauses', 'compliance')}</h3>
          <div className="space-y-4">
            {clauses.map((clause, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start space-x-3">
                  <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-800">{clause.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{clause.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      <span className="font-medium">{t('reference', 'compliance')}:</span> {clause.reference}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'checklist' && (
        <div className="space-y-4">
          <div className="flex space-x-2">
            {['lease_start', 'lease_end', 'tax_lodgement'].map((type) => (
              <button
                key={type}
                onClick={() => loadChecklist(type)}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                {t(`checklist_${type}`, 'compliance')}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="space-y-3">
              {checklist.map((item, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="w-5 h-5 border-2 border-gray-300 rounded flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.item}</p>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timezone' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Globe size={20} className="mr-2 text-blue-600" />
            {t('timezone_converter', 'compliance')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('from_timezone', 'compliance')}</label>
              <select
                value={timezoneFrom}
                onChange={(e) => setTimezoneFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('to_timezone', 'compliance')}</label>
              <select
                value={timezoneTo}
                onChange={(e) => setTimezoneTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('source_time', 'compliance')}</label>
              <input
                type="datetime-local"
                value={sourceTime}
                onChange={(e) => setSourceTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={convertTimezone}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {t('convert', 'compliance')}
              </button>
            </div>
          </div>
          {convertedTime && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock size={20} className="text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">{t('converted_time', 'compliance')}</p>
                  <p className="text-xl font-semibold text-blue-800">{convertedTime}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
