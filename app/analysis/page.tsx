"use client";

import { useState } from "react";

// Import React FilePond
import { FilePond } from "react-filepond";

// Import FilePond styles
import { MagicCard, MagicContainer } from "@/components/magicui/magic-card";
import "filepond/dist/filepond.min.css";

// Import the Image EXIF Orientation and Image Preview plugins
// Note: These need to be installed separately

export default function Analysis() {
  const [files, setFiles] = useState<any[]>([]);

  return (
    <main className="h-full flex items-start justify-center w-full font-sans">
      <MagicContainer className="py-12 h-[80vh] px-24">
        <MagicCard className="hide-links h-full flex items-center justify-center">
          <FilePond
            files={files}
            onupdatefiles={setFiles}
            allowMultiple={true}
            maxFiles={3}
            server="/api"
            name="files" /* sets the file input name, it's filepond by default */
            labelIdle='Drag & Drop your files or <span class="filepond--label-action">Browse</span>'
          />
        </MagicCard>
      </MagicContainer>
    </main>
  );
}
