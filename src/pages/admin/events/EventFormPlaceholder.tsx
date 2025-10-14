import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, Sparkles } from 'lucide-react';

export const EventFormPlaceholder: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/admin/events/list')}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Back to Events List</span>
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-blue-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          {isEdit ? 'Edit Event' : 'Add New Event'}
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          Event form coming in Phase 3
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left mb-8">
          <h2 className="text-lg font-semibold text-blue-800 mb-3">
            What to expect in Phase 3:
          </h2>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-start gap-2">
              <Calendar className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Event Details Form:</strong> Title, slug, description, date, and featured
                toggle
              </span>
            </li>
            <li className="flex items-start gap-2">
              <FileText className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Image Upload:</strong> Drag-and-drop multi-image upload with reordering
                and alt text
              </span>
            </li>
            <li className="flex items-start gap-2">
              <FileText className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Video Management:</strong> Add YouTube URLs with validation and preview
              </span>
            </li>
            <li className="flex items-start gap-2">
              <FileText className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Tag Management:</strong> Multi-select tags with create-new-tag option
              </span>
            </li>
            <li className="flex items-start gap-2">
              <FileText className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Draft & Publish:</strong> Save as draft or publish directly
              </span>
            </li>
          </ul>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate('/admin/events/list')}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to List
          </button>
          <button
            onClick={() => navigate('/admin/events/dashboard')}
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>

      {isEdit && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> You are trying to edit an event with ID: <code className="bg-yellow-100 px-2 py-0.5 rounded">{id}</code>.
            The edit functionality will be available in Phase 3.
          </p>
        </div>
      )}
    </div>
  );
};
