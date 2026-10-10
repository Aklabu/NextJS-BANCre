// Fahim
import { IconType } from "react-icons";
import Link from "next/link";

interface BlackButtonRightIconProps {
    buttonName: string;
    iconName: IconType; // react-icons component type
    width?: string;
    rounded?: string;
    href?: string;
}

export default function BlackButtonRightIcon({ buttonName, iconName: Icon, width, rounded, href = "#" }: BlackButtonRightIconProps) {
    return (
        <Link href={href} className={`bg-primary text-[#FFFFFF] flex items-center justify-center gap-2 
        px-4 py-2 mt-8 cursor-pointer hover:scale-105 ${width} ${rounded}`}>
            {buttonName}
            <Icon className="w-4 h-4" />
        </Link>
    );
}
