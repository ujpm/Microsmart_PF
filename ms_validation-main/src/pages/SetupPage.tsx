import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
import { useSession } from '../context/SessionContext';
import { Microscope, ShieldCheck, Info, Key, User, ExternalLink } from 'lucide-react';

export const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { startSession } = useSession();
  const [accessKey, setAccessKey] = useState('');
  const [title, setTitle] = useState('Dr.');
  const [name, setName] = useState('');
  const [credentials, setCredentials] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (accessKey !== import.meta.env.VITE_PILOT_ACCESS_KEY) {
      setError("Invalid Pilot Access Key.");
      setIsSubmitting(false);
      return;
    }

    // Combine title and name for a unique identifier
    const fullName = `${title} ${name.trim()}`;

    try {
      const { data: existingSession, error: searchError } = await supabase
        .from('annotator_sessions')
        .select('*')
        .eq('annotator_name', fullName)
        .maybeSingle();

      if (searchError) throw searchError;

      if (existingSession) {
        startSession(existingSession.session_id, existingSession.annotator_name);
        navigate('/workbench');
      } else {
        if (!credentials) {
          setError("Credentials are required for new users.");
          setIsSubmitting(false);
          return;
        }

        const { data: newSession, error: insertError } = await supabase
          .from('annotator_sessions')
          .insert([{
            annotator_name: fullName,
            credentials: credentials,
            status: 'In Progress',
          }])
          .select('session_id')
          .single();

        if (insertError) throw insertError;

        if (newSession) {
          startSession(newSession.session_id, fullName);
          navigate('/workbench');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Database connection failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-2 sm:p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 sm:grid-cols-2 bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl overflow-hidden border border-slate-200">
        
        <div className="bg-slate-900 text-slate-100 p-6 sm:p-10 flex flex-col justify-center">
          <div className="mb-6 text-blue-400">
            <Microscope size={48} strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">MicroSmart PF</h1>
          <h2 className="text-base sm:text-xl font-medium text-blue-300 mb-4 sm:mb-6">Ground Truth for Validation</h2>
          
          <div className="space-y-4 sm:space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed">
            <div className="flex items-start gap-2 sm:gap-3">
              <Info className="shrink-0 text-blue-400 mt-1" size={16} />
              <p>
                <strong> THANK YOU </strong> for considering to offer your expertise for this task. You will evaluate 100 mixed microscopy images. your inputs will help in validation of Micrsmart model. which aims to automate the identification and quantification of Plasmodium parasites.
              </p>
            </div>
            <div className="flex items-start gap-2 sm:gap-3">
              <Info className="shrink-0 text-blue-400 mt-1" size={16} />
              <p>
                Though the model was trained for detection of 3 species (viavax, malariae and falciparum), for this specific validation round, we are strictly targeting the identification and quantification of <strong>P. falciparum Trophozoites</strong> and <strong>Gametocytes</strong>. most images you will have one of those classes or is negative.
              </p>
            </div>
            <div className="flex items-start gap-2 sm:gap-3">
              <Info className="shrink-0 text-blue-400 mt-1" size={16} />
              <p>
                <strong>Your Task:</strong> Explore the image, count the target parasites, and log them. log everything you see on the slide. You can flag poor quality images or use the notes section to report secondary findings.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10 flex flex-col justify-center">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Access Portal</h3>
          <p className="text-slate-500 mb-6 sm:mb-8 text-xs sm:text-sm">Enter the pilot key and your unique identifier to begin or resume your session.</p>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-6 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Key size={16} /> Access Key
              </label>
              <input
                type="password"
                required
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Enter the access key provided by PI"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <User size={16} /> Annotator Profile
              </label>
              <div className="flex gap-2">
                <select 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="px-2 sm:px-3 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-sm"
                >
                  <option value="Mr.">Mr.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Tech.">Tech.</option>
                </select>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="Full Name (e.g., Ange Migisha)"
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Ensure your title and name match exactly if you are resuming a session.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Credentials** (New Users Only)
              </label>
              <input
                type="text"
                value={credentials}
                onChange={(e) => setCredentials(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="e.g., lab analyst at XXX..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mt-4"
            >
              {isSubmitting ? 'Authenticating...' : 'Enter Workbench'}
              {!isSubmitting && <ShieldCheck size={20} />}
            </button>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <a
                href="https://microsmartpf.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Visit our website for more <ExternalLink size={16} />
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
