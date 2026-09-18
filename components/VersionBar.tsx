/** The grey strip pinned to the bottom of every exam screen. */
export function VersionBar({ version = "17.07.00" }: { version?: string }) {
  return (
    <div className="bg-[#9e9e9e] py-1 text-center text-[12px] text-white">
      Version : {version}
    </div>
  );
}
