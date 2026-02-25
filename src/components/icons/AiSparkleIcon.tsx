
import React from 'react';

const AiSparkleIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.005 5.404.443c1.164.095 1.636 1.545.749 2.305l-4.108 3.48 1.245 5.273c.27 1.143-.964 2.033-1.97 1.42L12 18.354l-4.614 2.782c-1.006.613-2.24-.277-1.97-1.42l1.245-5.273-4.108-3.48c-.887-.76-.415-2.21.749-2.305l5.404-.443 2.082-5.005z" clipRule="evenodd" />
    </svg>
);

export default AiSparkleIcon;
