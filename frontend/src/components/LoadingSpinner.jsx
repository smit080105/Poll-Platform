function LoadingSpinner({ size = 40, text = '' }) {
  return (
    <div className="loading-screen">
      <div className="loading-spinner" style={{ width: size, height: size }} />
      {text && <p>{text}</p>}
    </div>
  );
}

export default LoadingSpinner;
