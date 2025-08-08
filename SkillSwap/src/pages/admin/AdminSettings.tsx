import React, { useState, useEffect } from 'react';
import { getMatchingConfig, setMatchingConfig, MatchingConfig } from '../../services/matchingConfigService';
import { Settings, Activity, Shield, HardDrive, Globe, Zap } from 'lucide-react';

const AdminSettings: React.FC = () => {
  const [matchingConfig, setMatchingConfigState] = useState<MatchingConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadMatchingConfig();
  }, []);

  const loadMatchingConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const config = await getMatchingConfig();
      setMatchingConfigState(config);
    } catch (e) {
      setError('Failed to load matching config');
    } finally {
      setLoading(false);
    }
  };

  const handleMatchingConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!matchingConfig) return;
    const { name, value } = e.target;
    setMatchingConfigState({
      ...matchingConfig,
      [name]: name === 'skillMatchWeight' || name === 'locationWeight' || name === 'ratingWeight' || name === 'maxDistanceKm'
        ? Number(value)
        : value,
    });
  };

  const handleSaveMatchingConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (matchingConfig) {
        await setMatchingConfig(matchingConfig);
        setSuccess('Matching settings updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (e) {
      setError('Failed to save matching config');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Platform Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-primary-600" />
            Matching Algorithm Settings
          </h3>
          <form onSubmit={handleSaveMatchingConfig} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">{error}</div>}
            {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded">{success}</div>}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skill Match Weight</label>
              <input 
                type="number" 
                step="0.01" 
                min="0" 
                max="1" 
                name="skillMatchWeight" 
                value={matchingConfig?.skillMatchWeight ?? ''} 
                onChange={handleMatchingConfigChange} 
                className="input-field" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location Weight</label>
              <input 
                type="number" 
                step="0.01" 
                min="0" 
                max="1" 
                name="locationWeight" 
                value={matchingConfig?.locationWeight ?? ''} 
                onChange={handleMatchingConfigChange} 
                className="input-field" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating Weight</label>
              <input 
                type="number" 
                step="0.01" 
                min="0" 
                max="1" 
                name="ratingWeight" 
                value={matchingConfig?.ratingWeight ?? ''} 
                onChange={handleMatchingConfigChange} 
                className="input-field" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Skill Level</label>
              <select 
                name="minSkillLevel" 
                value={matchingConfig?.minSkillLevel ?? 'beginner'} 
                onChange={handleMatchingConfigChange} 
                className="input-field"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Distance (km)</label>
              <input 
                type="number" 
                min="0" 
                name="maxDistanceKm" 
                value={matchingConfig?.maxDistanceKm ?? ''} 
                onChange={handleMatchingConfigChange} 
                className="input-field" 
                required 
              />
            </div>
            
            <button 
              type="submit" 
              className="btn-primary w-full" 
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2 text-primary-600" />
            Platform Configuration
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Admin Permissions
              </h4>
              <p className="text-sm text-blue-700">
                You have super admin privileges with full access to all platform features.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2 flex items-center">
                <HardDrive className="h-4 w-4 mr-2" />
                System Status
              </h4>
              <p className="text-sm text-green-700">
                All systems are running normally.
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2 flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                Platform Info
              </h4>
              <p className="text-sm text-purple-700">
                SkillSwap Platform v1.0.0
              </p>
            </div>
            
            <button
              onClick={loadMatchingConfig}
              className="btn-secondary w-full flex items-center justify-center space-x-2"
            >
              <Activity className="h-4 w-4" />
              <span>Refresh Configuration</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
