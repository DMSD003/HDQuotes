import { useState, useRef } from "react";
import { MoreVertical,Trash2, Eye, Pencil } from "lucide-react";

const QuoteRow = ({quote, onDelete, onView, onEdit}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const longPressTimer = useRef(null);

    const handleTouchStart = () => {
        longPressTimer.current = setTimeout(() => {
            setMenuOpen(true);
        }, 500);
    };

    const handleTouchEnd = () => {
        clearTimeout(longPressTimer.current);
    };

    const capitalize = (str) => {
        str.charAt(0).toUpperCase() + str.slice(1);
    };

    return (
        <li
            className={`flex-wrap relative ${menuOpen ? 'z-50': ''} flex items-center min-w-0 justify-between px-2 py-3 sm:py-2 border border-white/10 hover:bg-white/5 transition-colors`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
        >
            <span className="text-sm sm:text-base truncate pr-2 min-w-0">
                {quote.title.charAt(0) + quote.title.slice(1).toLowerCase().slice(0, 26) + "..."}
            </span>
            <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="p-1.5 rounded-full hover:bg-white/10 shrink-0"
                aria-label="Quote's options"
            >
                <MoreVertical size={18} />
            </button>
            {menuOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpen(false)}
                    />
                    <div className="w-40 basis-full mt-2 right-2 top-10 bg-white text-gray-800 rounded-lg shadow-xl border-gray-200 overflow-hidden">
                        <button
                            onClick={() => { onEdit(quote.id); setMenuOpen(false);}}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-200"
                        >
                            <Pencil size={14} />Editer
                        </button>

                        <button
                            onClick={() => { onView(quote.id); setMenuOpen(false);}}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-200"
                        >
                            <Eye size={14} />Voir
                        </button>

                        <button
                            onClick={() => { onDelete(quote.id); setMenuOpen(false);}}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-200"
                        >
                            <Trash2 size={14} />Supprimer
                        </button>

                    </div>
                </>
            )}
        </li>
    );
};

export  default QuoteRow;