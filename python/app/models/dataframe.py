from enum import Enum
from typing import Dict, List

import pandas as pd


class ColumnType(str, Enum):
    SAMPLE = "sample"


class TargetedIonsDataFrame(pd.DataFrame):
    # Constructor for the class
    def __init__(self, data, *args, **kwargs):
        super().__init__(data, *args, **kwargs)
        self._tags: Dict[str, List[str]] = {}

    def add_tag(self, tag: str, columns: List[str]):
        """
        Adds a tag to the specified columns. If the tag already exists, it updates the columns list.

        Parameters:
        - tag: str, the tag name.
        - columns: List[str], list of column names to tag.
        """
        if tag not in self._tags:
            self._tags[tag] = []
        for column in columns:
            if column in self.columns and column not in self._tags[tag]:
                self._tags[tag].append(column)

    def get_columns_by_tag(self, tag: str) -> pd.DataFrame:
        """
        Retrieves columns associated with the specified tag.

        Parameters:
        - tag: str, the tag name to retrieve columns for.

        Returns:
        - pd.DataFrame: DataFrame containing only the columns with the specified tag.
        """
        if tag in self._tags:
            return self[self._tags[tag]]
        else:
            return pd.DataFrame()
