export default function FormField({
  label,
  defaultValue,
}: {
  label: string;
  defaultValue: string;
}) {
  return (
    <div className="flex-1 flex flex-col items-start justify-start gap-[4.3px]">
      <div className="relative leading-[20px]">{label}</div>
      <input
        className="self-stretch flex-1 rounded-3xl bg-wwwpinksalefinance-catskill-white flex flex-row items-center justify-start pt-[7.5px] px-3 pb-2 text-wwwpinksalefinance-gray-chateau border-[1px] border-solid border-wwwpinksalefinance-athens-gray"
        defaultValue={defaultValue}
      />
    </div>
  );
}
