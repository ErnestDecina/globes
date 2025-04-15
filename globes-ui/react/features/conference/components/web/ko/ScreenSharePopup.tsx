import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

interface ScreenSharePopupProps {
    isOpen: boolean;
    onClose: () => void;
    onScreenShare: () => void;
    onFileSubmit: (files: { file1: File | null, file2: File | null }) => void;
}

const ScreenSharePopup: React.FC<ScreenSharePopupProps> = ({ 
    isOpen, 
    onClose, 
    onScreenShare, 
    onFileSubmit 
}) => {
    const [activeTab, setActiveTab] = useState<'screen' | 'files'>('screen');
    const [file1, setFile1] = useState<File | null>(null);
    const [file2, setFile2] = useState<File | null>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    // 팝업 바깥쪽 클릭 처리
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        // 팝업이 열려있을 때 이벤트 리스너 추가
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // 이벤트 리스너 정리
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onFileSubmit({ file1, file2 });
        onClose();
    };

    // 검은색 텍스트를 보장하기 위한 기본 텍스트 스타일
    const baseTextStyle = {
        color: "#000000"
    };

    return (
        <div 
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000
            }}
        >
            <div 
                ref={popupRef}
                style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    width: "400px",
                    maxWidth: "90%",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    color: "#000000" // 모든 내용의 기본 텍스트 색상
                }}
            >
                {/* 헤더 */}
                <div 
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "16px",
                        borderBottom: "1px solid #e5e7eb"
                    }}
                >
                    <h3 style={{ margin: 0, fontWeight: 600, color: "#000000" }}>콘텐츠 공유</h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#000000"
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 탭 */}
                <div 
                    style={{
                        display: "flex",
                        borderBottom: "1px solid #e5e7eb"
                    }}
                >
                    <button
                        onClick={() => setActiveTab('screen')}
                        style={{
                            flex: 1,
                            padding: "12px",
                            background: activeTab === 'screen' ? "#f3f4f6" : "transparent",
                            border: "none",
                            borderBottom: activeTab === 'screen' ? "2px solid #0394fc" : "none",
                            fontWeight: activeTab === 'screen' ? 600 : 400,
                            cursor: "pointer",
                            color: "#000000"
                        }}
                    >
                        화면 공유
                    </button>
                    <button
                        onClick={() => setActiveTab('files')}
                        style={{
                            flex: 1,
                            padding: "12px",
                            background: activeTab === 'files' ? "#f3f4f6" : "transparent",
                            border: "none",
                            borderBottom: activeTab === 'files' ? "2px solid #0394fc" : "none",
                            fontWeight: activeTab === 'files' ? 600 : 400,
                            cursor: "pointer",
                            color: "#000000"
                        }}
                    >
                        파일 업로드
                    </button>
                </div>

                {/* 내용 */}
                <div style={{ padding: "24px" }}>
                    {activeTab === 'screen' ? (
                        <div 
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center"
                            }}
                        >
                            <p style={{ marginBottom: "16px", textAlign: "center", color: "#000000" }}>
                                전체 화면 또는 특정 애플리케이션 창을 공유하세요
                            </p>
                            <button
                                onClick={() => {
                                    onScreenShare();
                                    onClose();
                                }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "10px 16px",
                                    borderRadius: "4px",
                                    backgroundColor: "#0394fc",
                                    color: "white", // 대비를 위해 버튼 텍스트는 흰색 유지
                                    border: "none",
                                    cursor: "pointer",
                                    fontWeight: 500
                                }}
                            >
                                화면 공유 시작
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: "16px" }}>
                                <label 
                                    htmlFor="file1" 
                                    style={{ 
                                        display: "block", 
                                        marginBottom: "8px",
                                        fontWeight: 500,
                                        color: "#000000"
                                    }}
                                >
                                    파일 1:
                                </label>
                                <input
                                    id="file1"
                                    type="file"
                                    onChange={(e) => setFile1(e.target.files ? e.target.files[0] : null)}
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "4px",
                                        color: "#000000"
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: "24px" }}>
                                <label 
                                    htmlFor="file2" 
                                    style={{ 
                                        display: "block", 
                                        marginBottom: "8px",
                                        fontWeight: 500,
                                        color: "#000000"
                                    }}
                                >
                                    파일 2:
                                </label>
                                <input
                                    id="file2"
                                    type="file"
                                    onChange={(e) => setFile2(e.target.files ? e.target.files[0] : null)}
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "4px",
                                        color: "#000000"
                                    }}
                                />
                            </div>
                            <button
                                type="submit"
                                style={{
                                    display: "block",
                                    width: "100%",
                                    padding: "10px 16px",
                                    borderRadius: "4px",
                                    backgroundColor: "#0394fc",
                                    color: "white", // 대비를 위해 버튼 텍스트는 흰색 유지
                                    border: "none",
                                    cursor: "pointer",
                                    fontWeight: 500
                                }}
                            >
                                파일 업로드
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScreenSharePopup;