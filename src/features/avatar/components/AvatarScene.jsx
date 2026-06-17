import { forwardRef, useImperativeHandle, useRef } from 'react';
import Avatar from '@/avatar/Avatar';

const AvatarScene = forwardRef((_, ref) => {
  const avatarRef = useRef(null);

  useImperativeHandle(ref, () => ({
    zoomIn:    () => avatarRef.current?.zoomIn?.(),
    zoomOut:   () => avatarRef.current?.zoomOut?.(),
    resetView: () => avatarRef.current?.resetView?.(),
  }));

  return <Avatar ref={avatarRef} />;
});

AvatarScene.displayName = 'AvatarScene';

export default AvatarScene;
