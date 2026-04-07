export type ItemRow = {
  id: number;
  title: string;
  description: string | null;
  created_at: Date;
};

export type ItemCreateBody = {
  title: string;
  description: string | null;
};

export type ItemUpdateBody = {
  title: string;
  description: string | null;
};
