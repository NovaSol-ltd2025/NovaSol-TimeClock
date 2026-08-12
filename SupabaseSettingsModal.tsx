import React, { useState } from 'react';
import { SupabaseConfig } from '../types';
import { saveSupabaseConfig, SUPABASE_SQL_SCHEMA } from '../lib/supabase';
import {
  Database,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Github,
  Globe,
  AlertCircle,
  X,
  Code2,
  ShieldCheck,
  Terminal,
} from 'lucide-react';

interface SupabaseSettingsModalProps {
  config: SupabaseConfig;
  onUpdateConfig: (cfg: SupabaseConfig) => void;
  onClose: () => void;
}

export const SupabaseSettingsModal: React.FC<SupabaseSettingsModalProps> = ({
  config,
  onUpdateConfig,
  onClose,
}) => {
  const [url, setUrl] = useState(config.url || '');
  const [anonKey, setAnonKey] = useState(config.anonKey || '');
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'supabase' | 'vercel' | 'github'>('supabase');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newCfg: SupabaseConfig = {
      url: url.trim(),
      anonKey: anonKey.trim(),
      isConnected: Boolean(url.trim() && anonKey.trim()),
    };
    saveSupabaseConfig(newCfg);
    onUpdateConfig(newCfg);
    alert('บันทึกการตั้งค่า Supabase เรียบร้อยแล้ว!');
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Title Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-base">ตั้งค่า Supabase / Deployment (Vercel & GitHub)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2 flex items-center gap-2 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('supabase')}
            className={`px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'supabase'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Database className="w-4 h-4" /> 12. Supabase DB
          </button>

          <button
            onClick={() => setActiveTab('vercel')}
            className={`px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'vercel'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" /> 13. Deploy Vercel
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'github'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Github className="w-4 h-4" /> 14. เก็บโค้ด GitHub
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {activeTab === 'supabase' && (
            <div className="space-y-4">
              <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl space-y-2">
                <h4 className="font-bold text-sky-900 text-sm flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-sky-600" />
                  การเชื่อมต่อ Supabase Database
                </h4>
                <p className="text-slate-600">
                  ระบบถูกออกแบบให้รองรับทั้ง Local State ในตัว และเมื่อกรอกข้อมูล URL และ anonKey
                  ของ Supabase ระบบจะเชื่อมต่อไปยังตาราง Supabase โดยอัตโนมัติ
                </p>
              </div>

              <form onSubmit={handleSave} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Supabase Anon API Key
                  </label>
                  <input
                    type="password"
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-md cursor-pointer transition"
                  >
                    บันทึกข้อมูลเชื่อมต่อ Supabase
                  </button>
                </div>
              </form>

              {/* SQL Schema Copy Block */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-sky-600" />
                    SQL Script สำหรับสร้างตารางใน Supabase SQL Editor
                  </h4>
                  <button
                    onClick={handleCopySql}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'คัดลอก SQL สำเร็จแล้ว!' : 'คัดลอก SQL Script'}</span>
                  </button>
                </div>

                <pre className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-[10px] overflow-x-auto max-h-48 border border-slate-800 leading-relaxed">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'vercel' && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-2 border border-slate-800">
                <h4 className="font-bold text-sky-400 text-sm flex items-center gap-2">
                  <Globe className="w-5 h-5 text-sky-400" />
                  คำแนะนำขั้นตอนการ Deploy ผ่าน Vercel
                </h4>
                <ol className="list-decimal pl-4 space-y-2 text-slate-300">
                  <li>ส่งออกโค้ดจากระบบนี้ หรือ Push ขึ้น GitHub Repository ของท่าน</li>
                  <li>ไปที่เว็บไซต์ <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-sky-400 underline font-bold">Vercel.com</a> แล้วล็อกอินบัญชี</li>
                  <li>กดคลิก <b>"Add New" → "Project"</b> และเลือก GitHub Repository ของโปรเจกต์นี้</li>
                  <li>ในส่วน <b>Build & Output Settings</b> เลือก Framework Preset เป็น <b>Vite</b></li>
                  <li>กดปุ่ม <b>Deploy</b> โค้ดจะถูกสร้างและออนไลน์พร้อมใช้งานทันทีผ่าน HTTPS</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'github' && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-2 border border-slate-800">
                <h4 className="font-bold text-purple-400 text-sm flex items-center gap-2">
                  <Github className="w-5 h-5 text-purple-400" />
                  คำแนะนำขั้นตอนการเก็บโค้ดบน GitHub
                </h4>
                <p className="text-slate-300">
                  สร้าง Repository ใหม่บน GitHub และใช้นิยามคำสั่งสำหรับอัปโหลดโค้ด:
                </p>
                <div className="bg-black/80 p-3 rounded-xl font-mono text-[11px] text-emerald-400 border border-slate-800 space-y-1">
                  <div>git init</div>
                  <div>git add .</div>
                  <div>git commit -m "Initial commit - NOVASOL Time Clock System"</div>
                  <div>git branch -M main</div>
                  <div>git remote add origin https://github.com/YOUR_USERNAME/novasol-time-clock.git</div>
                  <div>git push -u origin main</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Confirmation */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-slate-600 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>หจก.โนวาโซล (NOVASOL Ltd.) - ระบบลงเวลาเข้า-ออกงาน</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs cursor-pointer transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
