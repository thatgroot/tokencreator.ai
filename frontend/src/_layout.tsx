
export default function Layout(props:any)  {
  return (
    <div className="w-full relative h-screen text-center text-smi text-darkgray font-roboto self-stretch flex-1   bg-gray flex flex-col items-center justify-center">{
     props.children
    }</div>
  );
}
