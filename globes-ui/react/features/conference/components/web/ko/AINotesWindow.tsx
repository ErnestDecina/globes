import React, { useState, useEffect } from "react";
import { FileText, Save, Copy } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { IReduxState } from "../../../../app/types";

// Action type
export const UPDATE_AI_NOTES_CONTENT = 'UPDATE_AI_NOTES_CONTENT';

const AINotesWindow: React.FC = () => {
    const dispatch = useDispatch();
    const [notes, setNotes] = useState<string>("");
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    // Access relevant Redux state
    const roomName = useSelector((state: IReduxState) => 
        state["features/base/conference"].room);
    const localParticipant = useSelector((state: IReduxState) => 
        state["features/base/participants"].local);
    const participants = useSelector((state: IReduxState) => 
        state["features/base/participants"].remote);
    
    const aiNotesContent = useSelector((state: IReduxState) => 
        state["features/conference"].aiNotesContent || "");

    // Listen for messages from the parent window
    useEffect(() => {
        window.addEventListener('message', (event) => {
            // If we receive a command to generate notes
            if (event.data === 'generateNotes') {
                handleGenerateNotes();
            }
            
            // If we receive existing notes content
            if (event.data && event.data.type === 'notesContent') {
                setNotes(event.data.content);
            }
        });
        
        // Load existing notes when window opens
        setNotes(aiNotesContent);
        
        // Let the parent window know we're ready
        window.opener?.postMessage('aiNotesWindowReady', '*');
        
        // Handle window close event
        window.onbeforeunload = () => {
            window.opener?.postMessage({
                type: 'aiNotesWindowClosed',
                content: notes
            }, '*');
        };
    }, []);

    const handleGenerateNotes = () => {
        setIsGenerating(true);
        
        // Simulate AI generating notes - in a real implementation,
        // this would call an API endpoint to generate notes based on the meeting
        setTimeout(() => {
            const generatedNotes = `# Meeting Notes - ${new Date().toLocaleString()}
            
## Participants
${localParticipant ? `- ${localParticipant.name} (You)` : ''}
${participants.map(p => `- ${p.name}`).join('\n')}

## Summary
- AI-generated summary of the meeting would appear here
- Key points from the discussion
- Action items identified during the meeting

## Action Items
- Action item 1
- Action item 2
- Action item 3

## Next Steps
- Follow up item 1
- Follow up item 2
`;
            setNotes(generatedNotes);
            
            // Send the notes back to the parent window
            window.opener?.postMessage({
                type: 'notesUpdated',
                content: generatedNotes
            }, '*');
            
            setIsGenerating(false);
        }, 2000);
    };

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(notes);
        // Could add a toast notification here
    };

    const handleSave = () => {
        // Send the notes back to the parent window
        window.opener?.postMessage({
            type: 'notesSaved',
            content: notes
        }, '*');
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newNotes = e.target.value;
        setNotes(newNotes);
        
        // Notify parent window of changes
        window.opener?.postMessage({
            type: 'notesUpdated',
            content: newNotes
        }, '*');
    };

    return (
        <div style={{
            width: '100%',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'sans-serif'
        }}>
            {/* Header */}
            <div
                style={{
                    padding: "16px",
                    borderBottom: "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "#f3f4f6"
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FileText size={20} />
                    <h2 style={{ margin: 0, fontSize: "18px" }}>AI Meeting Notes</h2>
                </div>
                <div>Room: {roomName || "Unknown"}</div>
            </div>

            {/* Content */}
            <div
                style={{
                    padding: "16px",
                    overflowY: "auto",
                    flex: 1,
                }}
            >
                <textarea
                    value={notes}
                    onChange={handleChange}
                    style={{
                        width: "100%",
                        height: "calc(100vh - 140px)",
                        padding: "12px",
                        borderRadius: "4px",
                        border: "1px solid #d1d5db",
                        resize: "none",
                        fontSize: "14px",
                        lineHeight: "1.5",
                        fontFamily: "monospace",
                        boxSizing: "border-box"
                    }}
                    placeholder="Notes will appear here. Click 'Generate Notes' to create AI-powered meeting notes."
                />
            </div>

            {/* Actions */}
            <div
                style={{
                    padding: "16px",
                    borderTop: "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent: "space-between",
                    backgroundColor: "#f3f4f6"
                }}
            >
                <div>
                    <button
                        style={{
                            padding: "8px 16px",
                            backgroundColor: "#0394fc",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                        }}
                        onClick={handleGenerateNotes}
                        disabled={isGenerating}
                    >
                        {isGenerating ? "Generating..." : "Generate Notes"}
                    </button>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        style={{
                            padding: "8px 16px",
                            backgroundColor: "#f3f4f6",
                            color: "#374151",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                        }}
                        onClick={handleCopyToClipboard}
                    >
                        <Copy size={16} />
                        Copy
                    </button>
                    <button
                        style={{
                            padding: "8px 16px",
                            backgroundColor: "#2cfc03",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                        }}
                        onClick={handleSave}
                    >
                        <Save size={16} />
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AINotesWindow;