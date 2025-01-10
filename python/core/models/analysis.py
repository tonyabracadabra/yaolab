from enum import Enum
from typing import Literal

from pydantic import BaseModel

from core.utils.constants import AutoValueEnumMeta


class AnalysisTriggerInput(BaseModel):
    id: str


class AnalysisResult(BaseModel):
    nodes: list[dict]
    edges: list[dict]


class BioSample(BaseModel):
    name: str
    sample: list[str]
    blank: list[str]


class DrugSample(BaseModel):
    name: str
    groups: list[str]


class AnalysisConfig(BaseModel):
    minSignalThreshold: float
    signalEnrichmentFactor: float
    ms2SimilarityThreshold: float
    mzErrorThreshold: float
    rtTimeWindow: float
    correlationThreshold: float
    bioSamples: list[BioSample]
    drugSample: DrugSample | None = None

    class Config:
        arbitrary_types_allowed = True


class AnalysisStatus(AutoValueEnumMeta):
    RUNNING = "running"
    FAILED = "failed"
    COMPLETE = "complete"


class MSTool(str, Enum):
    MZmine3 = "MZmine3"
    MDial = "MDial"


class Reaction(BaseModel):
    formulaChange: str
    description: str
    mzDiff: float


class IonMode(str, Enum):
    POS = "pos"
    NEG = "neg"


class ReactionDatabase(BaseModel):
    name: str
    reactions: list[Reaction]
    ionMode: IonMode

    class Config:
        arbitrary_types_allowed = True


class RawFile(BaseModel):
    name: str
    tool: MSTool
    mgf: str
    targetedIons: str
    sampleCols: list[str]

    class Config:
        arbitrary_types_allowed = True


class Analysis(BaseModel):
    reactionDb: ReactionDatabase | Literal["default-pos"] | Literal["default-neg"]
    rawFile: RawFile
    config: AnalysisConfig

    class Config:
        arbitrary_types_allowed = True
        extra = "ignore"


class MassInput(BaseModel):
    """Input model for mass calculation endpoint"""

    formulaChanges: list[str]


class PreprocessIonsInput(BaseModel):
    """Input model for preprocessing ions endpoint"""

    targetedIons: str
    tool: MSTool
