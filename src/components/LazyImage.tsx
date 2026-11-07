import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className, imgClassName }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    setHasLoaded(false);
  }, [src]);

  return (
    <div ref={imgRef} className={`w-full h-full overflow-hidden ${className} ${hasLoaded ? '' : 'bg-stone-100 animate-pulse'}`}>
      {(isVisible || hasLoaded) && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-cover object-top ${imgClassName}`}
          onLoad={() => setHasLoaded(true)}
        />
      )}
    </div>
  );
};

export default LazyImage;
