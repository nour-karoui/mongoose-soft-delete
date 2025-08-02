import { PipelineStage } from "mongoose";

type FilterFieldsStage = {
  [k: string]: { 
    $filter: { 
      input: `$${string}`; 
      as: string; 
      cond: { $ne: [string, boolean] } 
    } 
  };
};

/**
 * Checks if a lookup stage is valid for soft delete filtering
 */
const isValidLookupStage = (lookupStage: PipelineStage.Lookup['$lookup']): boolean => {
  return !!(
    lookupStage.from &&
    lookupStage.localField &&
    lookupStage.foreignField &&
    lookupStage.as &&
    !lookupStage.localField.includes('.') // exclude nested lookups
  );
};

/**
 * Creates an $addFields stage to filter out soft deleted documents from lookup results
 */
const createSoftDeleteFilterStage = (fieldName: string): { $addFields: FilterFieldsStage } => {
  return {
    $addFields: {
      [fieldName]: {
        $filter: {
          input: `$${fieldName}`,
          as: 'temp',
          cond: { $ne: ['$$temp.isDeleted', true] },
        },
      },
    },
  };
};

/**
 * Processes a $lookup stage and adds soft delete filtering if applicable
 */
const processLookupStage = (
  stage: PipelineStage, 
  pipeline: PipelineStage[], 
  index: number
): void => {
  const lookupStage = stage['$lookup' as keyof typeof stage] as PipelineStage.Lookup['$lookup'];
  
  if (!lookupStage || !isValidLookupStage(lookupStage)) {
    return;
  }

  const { as } = lookupStage;
  const filterStage = createSoftDeleteFilterStage(as);
  pipeline.splice(index + 1, 0, filterStage);
};

/**
 * Processes a $match stage and adds soft delete filtering if needed
 */
const processMatchStage = (stage: PipelineStage, pipeline: PipelineStage[], index: number): void => {
  const matchStage = stage['$match' as keyof typeof stage] as PipelineStage.Match['$match'];
  
  if (!matchStage) {
    return;
  }

  // Skip if already filtering for deleted documents
  if (matchStage.isDeleted === true) {
    return;
  }

  // Add soft delete filter to existing match conditions
  (pipeline[index] as { '$match': PipelineStage.Match['$match'] })['$match'] = { 
    ...matchStage, 
    isDeleted: false 
  };
};

/**
 * Overwrites aggregation pipeline to handle soft deleted documents
 * - Adds filtering for soft deleted documents in $lookup results
 * - Ensures $match stages exclude soft deleted documents
 */
export const overwriteAggregatePipeline = (pipeline: PipelineStage[]): PipelineStage[] => {
  pipeline.forEach((stage, index) => {
    processLookupStage(stage, pipeline, index);
    processMatchStage(stage, pipeline, index);
  });
  
  return pipeline;
};