import { DanswerDocument } from "@/lib/search/interfaces";
import { DocumentFeedbackBlock } from "./DocumentFeedbackBlock";
import { useState } from "react";
import { PopupSpec } from "../admin/connectors/Popup";
import { HoverPopup } from "@/components/HoverPopup";
import { DocumentUpdatedAtBadge } from "./DocumentUpdatedAtBadge";
import { FiInfo, FiRadio, FiStar, FiTag } from "react-icons/fi";
import { SourceIcon } from "../SourceIcon";
import { MetadataBadge } from "../MetadataBadge";
import { LoadingAnimation } from "../Loading";
import FunctionalLoader from "@/lib/search/Loader";
import { FaCaretDown, FaCaretRight, FaRobot } from "react-icons/fa";

export const buildDocumentSummaryDisplay = (
  matchHighlights: string[],
  blurb: string
) => {
  if (matchHighlights.length === 0) {
    return blurb;
  }

  // content, isBold, isContinuation
  let sections = [] as [string, boolean, boolean][];
  matchHighlights.forEach((matchHighlight, matchHighlightIndex) => {
    if (!matchHighlight) {
      return;
    }

    const words = matchHighlight.split(new RegExp("\\s"));
    words.forEach((word) => {
      if (!word) {
        return;
      }

      let isContinuation = false;
      while (word.includes("<hi>") && word.includes("</hi>")) {
        const start = word.indexOf("<hi>");
        const end = word.indexOf("</hi>");
        const before = word.slice(0, start);
        const highlight = word.slice(start + 4, end);
        const after = word.slice(end + 5);

        if (before) {
          sections.push([before, false, isContinuation]);
          isContinuation = true;
        }
        sections.push([highlight, true, isContinuation]);
        isContinuation = true;
        word = after;
      }

      if (word) {
        sections.push([word, false, isContinuation]);
      }
    });
    if (matchHighlightIndex != matchHighlights.length - 1) {
      sections.push(["...", false, false]);
    }
  });

  let previousIsContinuation = sections[0][2];
  let previousIsBold = sections[0][1];
  let currentText = "";
  const finalJSX = [] as (JSX.Element | string)[];
  sections.forEach(([word, shouldBeBold, isContinuation], index) => {
    if (shouldBeBold != previousIsBold) {
      if (currentText) {
        if (previousIsBold) {
          // remove leading space so that we don't bold the whitespace
          // in front of the matching keywords
          currentText = currentText.trim();
          if (!previousIsContinuation) {
            finalJSX[finalJSX.length - 1] = finalJSX[finalJSX.length - 1] + " ";
          }
          finalJSX.push(
            <b key={index} className="text-default bg-highlight-text">
              {currentText}
            </b>
          );
        } else {
          finalJSX.push(currentText);
        }
      }
      currentText = "";
    }
    previousIsBold = shouldBeBold;
    previousIsContinuation = isContinuation;
    if (!isContinuation || index === 0) {
      currentText += " ";
    }
    currentText += word;
  });
  if (currentText) {
    if (previousIsBold) {
      currentText = currentText.trim();
      if (!previousIsContinuation) {
        finalJSX[finalJSX.length - 1] = finalJSX[finalJSX.length - 1] + " ";
      }
      finalJSX.push(
        <b key={sections.length} className="text-default bg-highlight-text">
          {currentText}
        </b>
      );
    } else {
      finalJSX.push(currentText);
    }
  }
  return finalJSX;
};

export function DocumentMetadataBlock({
  document,
}: {
  document: DanswerDocument;
}) {
  // don't display super long tags, as they are ugly
  const MAXIMUM_TAG_LENGTH = 40;

  return (
    <div className="flex flex-wrap gap-1">
      {document.updated_at && (
        <div className="pr-1">
          <DocumentUpdatedAtBadge updatedAt={document.updated_at} />
        </div>
      )}

      {Object.entries(document.metadata).length > 0 && (
        <>
          <div className="pl-1 border-l border-border" />
          {Object.entries(document.metadata)
            .filter(
              ([key, value]) => (key + value).length <= MAXIMUM_TAG_LENGTH
            )
            .map(([key, value]) => {
              return (
                <MetadataBadge
                  key={key}
                  icon={FiTag}
                  value={`${key}=${value}`}
                />
              );
            })}
        </>
      )}
      {!document.updated_at &&
        Object.entries(document.metadata).length == 0 && (
          <MetadataBadge icon={FiStar} value={`TODO`} />
        )}
    </div>
  );
}

interface DocumentDisplayProps {
  document: DanswerDocument;
  messageId: number | null;
  documentRank: number;
  isSelected: boolean;
  setPopup: (popupSpec: PopupSpec | null) => void;
  relevance: any;
  comments?: any;
  hide?: boolean;
  index?: number;
}

export const DocumentDisplay = ({
  document,
  isSelected,
  relevance,
  messageId,
  documentRank,
  hide,
  index,
  setPopup,
}: DocumentDisplayProps) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div
      key={document.semantic_identifier}
      className={`text-sm border-b border-border transition-all duration-500 
        ${hide ? "transform translate-x-full opacity-0" : ""} 
        ${!hide ? "pt-3" : "border-transparent"} relative`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transitionDelay: `${index! * 10}ms`, // Add a delay to the transition based on index
      }}
    >
      <div
        className={
          "absolute top-6 overflow-y-auto -translate-y-2/4 flex " +
          (isSelected ? "-left-14 w-14" : "-left-10 w-10")
        }
      >
        {!hide &&
          relevance &&
          (relevance[document.document_id] ? (
            <svg
              className="h-4 w-4 text-xs text-emphasis bg-hover-emphasis rounded p-0.5 w-fit my-auto select-none ml-auto mr-2"
              xmlns="http://www.w3.org/2000/svg"
              width="200"
              height="200"
              viewBox="0 0 24 24"
            >
              <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 6L9 17l-5-5"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4 text-xs text-emphasis bg-hover rounded p-0.5 w-fit my-auto select-none ml-auto mr-2"
              xmlns="http://www.w3.org/2000/svg"
              width="200"
              height="200"
              viewBox="0 0 24 24"
            >
              <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M18 6L6 18M6 6l12 12"
              />
            </svg>
          ))}
        {!hide && !relevance && (
          <div className="text-xs text-emphasis rounded p-0.5 w-fit my-auto overflow-y-auto select-none ml-auto mr-2">
            <FunctionalLoader />
          </div>
        )}
      </div>

      <div
        className={`collapsible ${hide ? "collapsible-closed overflow-y-auto border-transparent" : ""}`}
      >
        <div className="flex relative">
          <a
            className={`rounded-lg flex font-bold text-link max-w-full ${document.link ? "" : "pointer-events-none"}`}
            href={document.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            <SourceIcon sourceType={document.source_type} iconSize={22} />
            <p className="truncate text-wrap break-all ml-2 my-auto text-base max-w-full">
              {document.semantic_identifier || document.document_id}
            </p>
          </a>
          <div className="ml-auto">
            {isHovered && messageId && (
              <DocumentFeedbackBlock
                documentId={document.document_id}
                messageId={messageId}
                documentRank={documentRank}
                setPopup={setPopup}
              />
            )}
          </div>
        </div>
        <div className="mt-1">
          <DocumentMetadataBlock document={document} />
        </div>
        <p className="pl-1 pt-2 pb-3 break-words">
          {buildDocumentSummaryDisplay(
            document.match_highlights,
            document.blurb
          )}
        </p>
      </div>
    </div>
  );
};

export const AgenticDocumentDisplay = ({
  document,
  isSelected,
  relevance,
  comments,
  messageId,
  documentRank,
  hide,
  index,
  setPopup,
}: DocumentDisplayProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showContext, setShowContext] = useState(false);

  return (
    <div
      key={document.semantic_identifier}
      className={`text-sm border-b border-border transition-all duration-500 
        ${hide ? "transform translate-x-full opacity-0" : ""} 
        ${!hide ? "pt-3" : "border-transparent"} relative`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transitionDelay: `${index! * 10}ms`, // Add a delay to the transition based on index
      }}
    >
      <div
        className={
          "absolute top-6 overflow-y-auto -translate-y-2/4 flex " +
          (isSelected ? "-left-14 w-14" : "-left-10 w-10")
        }
      >
        {!hide &&
          relevance &&
          (relevance[document.document_id] ? (
            <svg
              className="h-4 w-4 text-xs text-emphasis bg-hover-emphasis rounded p-0.5 w-fit my-auto select-none ml-auto mr-2"
              xmlns="http://www.w3.org/2000/svg"
              width="200"
              height="200"
              viewBox="0 0 24 24"
            >
              <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 6L9 17l-5-5"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4 text-xs text-emphasis bg-hover rounded p-0.5 w-fit my-auto select-none ml-auto mr-2"
              xmlns="http://www.w3.org/2000/svg"
              width="200"
              height="200"
              viewBox="0 0 24 24"
            >
              <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M18 6L6 18M6 6l12 12"
              />
            </svg>
          ))}
        {!hide && !relevance && (
          <div className="text-xs text-emphasis rounded p-0.5 w-fit my-auto overflow-y-auto select-none ml-auto mr-2">
            <FunctionalLoader />
          </div>
        )}
      </div>

      <div
        className={`collapsible   ${hide ? "collapsible-closed overflow-y-auto border-transparent" : "pb-3"}`}
      >
        <div className="flex relative">
          <a
            className={`rounded-lg flex font-bold text-link max-w-full ${document.link ? "" : "pointer-events-none"}`}
            href={document.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            <SourceIcon sourceType={document.source_type} iconSize={22} />
            <p className="truncate text-wrap break-all ml-2 my-auto text-base max-w-full">
              {document.semantic_identifier || document.document_id}
            </p>
          </a>
          <div className="ml-auto">
            {isHovered && messageId && (
              <DocumentFeedbackBlock
                documentId={document.document_id}
                messageId={messageId}
                documentRank={documentRank}
                setPopup={setPopup}
              />
            )}
          </div>
        </div>
        <div className="mt-1">
          <DocumentMetadataBlock document={document} />
        </div>
        <div className="pt-2 break-words flex gap-x-2">
          <p className="mb-auto flex">
            <FaRobot className="h-4 w-4 flex-none" />
            {":"}
          </p>
          <p>{comments[document.document_id]}</p>
        </div>
        <div className="pt-2 break-words flex gap-x-2">
          <button
            className="flex"
            onClick={() => setShowContext((showContext) => !showContext)}
          >
            {showContext ? (
              <FaCaretRight className="h-4 w-4" />
            ) : (
              <FaCaretDown className="-my-2 h-4 w-4" />
            )}
          </button>

          {showContext && (
            <p className="pl-1 break-words">
              {buildDocumentSummaryDisplay(
                document.match_highlights,
                document.blurb
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
