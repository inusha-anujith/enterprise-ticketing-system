// pages/Analytics.jsx

// WHY WE DO THIS: In a real app, this page will eventually fetch its own specific data 
// (like resolution times). Keeping it separate prevents App.jsx from becoming massive.
export default function Analytics() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center mt-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Analytics & Reports</h2>
      <p className="text-gray-500">Charts and graphs will go here in the future!</p>
      
      <div className="mt-12 flex justify-center items-end space-x-4 h-48 border-b-2 border-gray-200 pb-2">
        <div className="h-16 w-12 bg-blue-200 rounded-t-md"></div>
        <div className="h-32 w-12 bg-blue-400 rounded-t-md"></div>
        <div className="h-24 w-12 bg-blue-300 rounded-t-md"></div>
        <div className="h-44 w-12 bg-blue-600 rounded-t-md"></div>
      </div>
    </div>
  );
}