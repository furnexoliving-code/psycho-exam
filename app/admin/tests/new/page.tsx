import { createTest } from "../../actions";

export default function NewTestPage() {
  return (
    <>
      <h1 className="text-xl font-bold text-gray-900">Create a test</h1>
      <p className="mt-1 text-[13px] text-gray-600">
        Give it a name now; add sections and questions on the next screen.
      </p>

      <form
        action={createTest}
        className="mt-5 max-w-xl space-y-4 rounded border border-gray-300 bg-white p-5"
      >
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-gray-700">
            Test name (English) <span className="text-red-600">*</span>
          </span>
          <input
            name="name_en"
            required
            placeholder="ALP Psycho Full Test - 1"
            className="w-full rounded border border-gray-400 px-3 py-2 text-[14px]"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-gray-700">
            Test name (Hindi)
          </span>
          <input
            name="name_hi"
            placeholder="एएलपी साइको पूर्ण परीक्षण - 1"
            className="w-full rounded border border-gray-400 px-3 py-2 text-[14px]"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-gray-700">
            Title shown in the exam toolbar
          </span>
          <input
            name="display_name"
            placeholder="ALP Psycho Full Test - 1 (Free)"
            className="w-full rounded border border-gray-400 px-3 py-2 text-[14px]"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-gray-700">
            Web address (leave blank to generate)
          </span>
          <input
            name="slug"
            placeholder="alp-psycho-1"
            className="w-full rounded border border-gray-400 px-3 py-2 text-[14px]"
          />
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_free" defaultChecked className="h-4 w-4" />
          <span className="text-[13px] text-gray-800">Free test</span>
        </label>

        <button
          type="submit"
          className="rounded bg-indigo-800 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-900"
        >
          Create test
        </button>
      </form>
    </>
  );
}
