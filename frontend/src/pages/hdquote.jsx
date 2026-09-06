import CameraCapture from './components/CameraCapture';

const hdquote = () =>  {

    return (
       <div className="registration-page h-[100%] w-[100%] relative align-center flex flex-col justify-center items-center bg-[#eef2f7] ovrflow-hidden border border-white/70 rounded-lg backdrop-blur-[12px] backdrop-sature-[160%] shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] ">
        <CameraCapture />
       </div>
    )
}