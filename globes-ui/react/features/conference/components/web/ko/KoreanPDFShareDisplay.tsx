import React, { Component } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Dispatch } from "redux";
import { nextImage, previousImage, setLanguage, toggleDropdown } from "../../../actions.web";
import { connect } from "react-redux";

interface IProps {
    nextImage: () => void;
    previousImage: () => void;
    setLanguage: (language: string) => void;
    toggleDropdown: () => void;

    currentIndex: number;
    language: string;
    urlLang: string;
    showDropdown: boolean;
    url: string;
    isLocalPDFScreenSharePresenter: boolean;
}

class KoreanPDFShareDisplay extends Component<IProps> {
    handlePrevious = () => {
        this.props.previousImage();
    };

    handleNext = () => {
        this.props.nextImage();
    };

    toggleDropdown = () => {
        this.props.toggleDropdown();
    };

    handleLanguageChange = (lang) => {
        this.props.setLanguage(lang);
    };

    render() {
        const { currentIndex, language, showDropdown } = this.props;

        return (
            <div
                style={{
                    position: "relative",
                    maxWidth: "100%",
                    margin: "0 auto",
                }}
            >
                {/* Image container */}
                <div
                    style={{
                        position: "relative",
                    }}
                >
                    <img
                        src={`http://localhost:3000/static/meetings/${this.props.url}/${this.props.language}/images/slide_00${this.props.currentIndex}.png`}
                        alt="Featured image"
                        style={{
                            width: "100%",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        }}
                    />

                    {/* Language dropdown - positioned at top middle */}
                    <div
                        style={{
                            position: "absolute",
                            top: "16px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            zIndex: 10,
                        }}
                    >
                        <div
                            style={{
                                position: "relative",
                                color: "#000000",
                            }}
                        >
                            <button
                                onClick={this.toggleDropdown}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    width: "120px",
                                    padding: "8px 12px",
                                    backgroundColor: "#646464",
                                    borderRadius: "4px",
                                    border: "none",
                                    cursor: "pointer",
                                    fontWeight: "500",
                                    fontSize: "14px",
                                    backdropFilter: "blur(4px)",
                                }}
                            >
                                {language === "ko" ? "한국어" : "영어"}
                                <ChevronDown size={16} />
                            </button>

                            {showDropdown && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "100%",
                                        left: "0",
                                        width: "120px",
                                        marginTop: "4px",
                                        backgroundColor: "#646464",
                                        borderRadius: "4px",
                                        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                                        overflow: "hidden",
                                    }}
                                >
                                    <button
                                        onClick={() => this.handleLanguageChange("en")}
                                        style={{
                                            display: "block",
                                            width: "100%",
                                            padding: "8px 12px",
                                            textAlign: "left",
                                            border: "none",
                                            backgroundColor: "#646464",
                                            cursor: "pointer",
                                        }}
                                    >
                                        영어
                                    </button>
                                    <button
                                        onClick={() => this.handleLanguageChange("ko")}
                                        style={{
                                            display: "block",
                                            width: "100%",
                                            padding: "8px 12px",
                                            textAlign: "left",
                                            border: "none",
                                            backgroundColor: "#646464",
                                            cursor: "pointer",
                                        }}
                                    >
                                        한국어
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation buttons - positioned at bottom middle */}
                    {this.props.isLocalPDFScreenSharePresenter ? (
                        <div
                            style={{
                                position: "absolute",
                                bottom: "16px",
                                left: "50%",
                                transform: "translateX(-50%)",
                                display: "flex",
                                gap: "16px",
                            }}
                        >
                            {/* Left button */}
                            <button
                                onClick={this.handlePrevious}
                                aria-label="Previous image"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    backgroundColor: "#0394fc",
                                    color: "white",
                                    border: "none",
                                    cursor: "pointer",
                                    transition: "background-color 0.2s ease",
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#0378d4")}
                                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#0394fc")}
                            >
                                <ChevronLeft size={24} />
                            </button>

                            {/* Right button */}
                            <button
                                onClick={this.handleNext}
                                aria-label="Next image"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    backgroundColor: "#0394fc",
                                    color: "white",
                                    border: "none",
                                    cursor: "pointer",
                                    transition: "background-color 0.2s ease",
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#0378d4")}
                                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#0394fc")}
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    ) : (
                        <></>
                    )}
                </div>
            </div>
        );
    }
}

function mapStateToProps(state) {
    const { locationURL = { href: "" } as URL } = state["features/base/connection"];
    const url = locationURL.pathname.slice(1);
    return {
        currentIndex: state["features/conference"].currentIndex,
        language: state["features/conference"].languageSelection,
        showDropdown: state["features/conference"].showDropdown,
        url: url,
        isLocalPDFScreenSharePresenter: state["features/conference"].isLocalPDFScreenSharePresenter,
    };
}

// Map Redux actions to component props
const mapDispatchToProps = (dispatch: Dispatch) => ({
    nextImage: () => dispatch(nextImage()),
    previousImage: () => dispatch(previousImage()),
    setLanguage: (language: string) => dispatch(setLanguage(language)),
    toggleDropdown: () => dispatch(toggleDropdown()),
});

// Connect the component to Redux
export default connect(mapStateToProps, mapDispatchToProps)(KoreanPDFShareDisplay);
