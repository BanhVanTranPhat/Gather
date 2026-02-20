import React, { useState } from 'react';
import { FaUserShield, FaArrowLeft, FaBriefcase } from 'react-icons/fa';
import AccountSettings from './AccountSettings';
import GeneralSettings from './GeneralSettings';
import AudioVideoSettings from './AudioVideoSettings';

interface Props { onBack: () => void; }

export default function SettingsLayout({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<'account' | 'workspace'>('account');

  const tabs = [
    { id: 'account' as const, label: 'Tài khoản', icon: <FaUserShield /> },
    { id: 'workspace' as const, label: 'Phòng / Workspace', icon: <FaBriefcase /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <div className="space-y-10">
            <AccountSettings />
            <section className="border-t border-gray-200 dark:border-gray-700 pt-8">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Thông báo & Riêng tư</h2>
              <GeneralSettings />
            </section>
            <section className="border-t border-gray-200 dark:border-gray-700 pt-8">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Âm thanh & Hình ảnh</h2>
              <AudioVideoSettings />
            </section>
          </div>
        );
      case 'workspace':
        return (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <h3 className="text-xl font-bold mb-2">Tính năng đang phát triển</h3>
            <p>Quản lý nhiều phòng (workspace) sẽ sớm ra mắt.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    // ✅ THÊM: dark:bg-gray-900 transition-colors
    <div className="flex flex-col h-screen bg-[#F5F7FA] dark:bg-gray-900 transition-colors duration-300">
        
        {/* Header */}
        {/* ✅ THÊM: dark:bg-gray-800 dark:border-gray-700 */}
        <div className="bg-white dark:bg-gray-800 h-16 border-b border-gray-200 dark:border-gray-700 flex items-center px-6 gap-4 transition-colors duration-300">
            {/* ✅ THÊM: dark:hover:bg-gray-700 dark:text-gray-300 */}
            <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-600 dark:text-gray-300">
                <FaArrowLeft />
            </button>
            {/* ✅ THÊM: dark:text-white */}
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Cài đặt</h1>
        </div>

        <div className="flex flex-1 overflow-hidden p-6 gap-6">
            {/* Sidebar */}
            {/* ✅ THÊM: dark:bg-gray-800 dark:border-gray-700 */}
            <div className="w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 h-full flex flex-col transition-colors duration-300">
            <nav className="space-y-1">
                {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    activeTab === tab.id
                        // ✅ Active State Dark Mode
                        ? 'bg-blue-50 text-blue-600 font-bold dark:bg-blue-900/30 dark:text-blue-400' 
                        // ✅ Inactive State Dark Mode
                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                >
                    <span className="text-lg">{tab.icon}</span>
                    {tab.label}
                </button>
                ))}
            </nav>
            </div>

            {/* Content */}
            {/* ✅ THÊM: dark:bg-gray-800 dark:border-gray-700 */}
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 overflow-y-auto transition-colors duration-300">
            <div className="max-w-3xl mx-auto">
                {renderContent()}
            </div>
            </div>
        </div>
    </div>
  );
}