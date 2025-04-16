// components/shlink-stats.tsx
"use client";

import { useState, useEffect, FC } from 'react';
import {
  Calendar,
  FilterX,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import {
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Bar,
  ResponsiveContainer,
  Cell,
  LineChart as RechartLineChart,
  Line
} from 'recharts';
import { getVisitStats } from '@/lib/api-service';
import { StatsItem, StatsOptions, StatsResponse, StatsType, TimeBasedStatsItem } from '@/types/api';

interface DateRangeSelectorProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onClear: () => void;
}

// Helper component for date range selection
const DateRangeSelector: FC<DateRangeSelectorProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear
}) => {
  return (
    <div className="flex space-x-4 mb-4">
      <div>
        <Label className="text-sm mb-1 block">Start Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <Calendar className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, 'PPP') : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <CalendarComponent
              mode="single"
              selected={startDate}
              onSelect={onStartDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label className="text-sm mb-1 block">End Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <Calendar className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, 'PPP') : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <CalendarComponent
              mode="single"
              selected={endDate}
              onSelect={onEndDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-end">
        <Button variant="ghost" onClick={onClear} className="mb-0.5">
          <FilterX className="h-4 w-4 mr-1" /> Clear
        </Button>
      </div>
    </div>
  );
};

interface VisitsBarChartProps {
  data: StatsItem[];
  dataKey?: string;
  nameKey?: string;
  color?: string;
}

// Bar chart component for visualization
const VisitsBarChart: FC<VisitsBarChartProps> = ({
  data,
  dataKey = 'count',
  nameKey = 'name',
  color = '#4f46e5'
}) => {
  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-gray-500">No data available</div>;
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 20,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={nameKey}
            angle={-45}
            textAnchor="end"
            height={60}
            tick={{ fontSize: 12 }}
          />
          <YAxis />
          <RechartsTooltip
            formatter={(value: number) => [`${value} visits`, 'Visits']}
            labelFormatter={(label: string) => `${label}`}
          />
          <Bar dataKey={dataKey} fill={color}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

interface VisitsLineChartProps {
  data: TimeBasedStatsItem[];
  dataKey?: string;
  nameKey?: string;
  color?: string;
}

// Line chart component for time series data
const VisitsLineChart: FC<VisitsLineChartProps> = ({
  data,
  dataKey = 'count',
  nameKey = 'date',
  color = '#4f46e5'
}) => {
  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-gray-500">No data available</div>;
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartLineChart
          data={data}
          margin={{
            top: 20,
            right: 20,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={nameKey}
            angle={-45}
            textAnchor="end"
            height={60}
            tick={{ fontSize: 12 }}
          />
          <YAxis />
          <RechartsTooltip
            formatter={(value: number) => [`${value} visits`, 'Visits']}
            labelFormatter={(label: string) => `${label}`}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={{ stroke: color, strokeWidth: 2, r: 4 }}
            activeDot={{ stroke: color, strokeWidth: 2, r: 6 }}
          />
        </RechartLineChart>
      </ResponsiveContainer>
    </div>
  );
};

interface StatsSummaryProps {
  stats: StatsResponse | null;
}

// Stats summary cards
const StatsSummary: FC<StatsSummaryProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Total Visits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Non-Bot Visits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.nonBots}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Bot Visits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.bots}</div>
        </CardContent>
      </Card>
    </div>
  );
};

interface ShlinkStatsProps {
  apiUrl: string;
  apiKey: string;
  shortCode: string; // Required parameter for the short URL
}

// Main component
export const ShlinkStats: FC<ShlinkStatsProps> = ({ apiUrl, apiKey, shortCode }) => {
  const [statsType, setStatsType] = useState<StatsType>('countries');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [excludeBots, setExcludeBots] = useState<boolean>(true);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, [apiUrl, apiKey, shortCode, statsType, startDate, endDate, excludeBots]);

  const loadStats = async () => {
    if (!apiUrl || !apiKey || !shortCode) return;

    setIsLoading(true);
    setError(null);

    try {
      const options: StatsOptions = {
        excludeBots
      };

      if (startDate) {
        options.startDate = format(startDate, "yyyy-MM-dd'T'HH:mm:ssXXX");
      }

      if (endDate) {
        options.endDate = format(endDate, "yyyy-MM-dd'T'HH:mm:ssXXX");
      }

      // Pass the shortCode to the getVisitStats function
      const result = await getVisitStats(
        apiUrl,
        apiKey,
        shortCode,
        statsType,
        options
      );
      setStats(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load statistics';
      setError(errorMessage);
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearDateRange = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  // Format data for charts based on stats type
  const formatChartData = () => {
    if (!stats || !stats.stats) return [];

    switch (statsType) {
      case 'countries':
      case 'cities':
        // Remove "Unknown" entry and sort by visit count
        return [...stats.stats.filter(item => (item as StatsItem).name !== 'Unknown')]
          .sort((a, b) => (b as StatsItem).count - (a as StatsItem).count)
          .slice(0, 15); // Limit to top 15

      case 'browsers':
      case 'os':
      case 'referrers':
        return [...stats.stats]
          .sort((a, b) => (b as StatsItem).count - (a as StatsItem).count)
          .slice(0, 15); // Limit to top 15

      case 'days':
      case 'months':
        return [...stats.stats];

      default:
        return stats.stats;
    }
  };

  const formatStatsTitle = () => {
    switch (statsType) {
      case 'countries': return 'Visits by Country';
      case 'cities': return 'Visits by City';
      case 'browsers': return 'Visits by Browser';
      case 'os': return 'Visits by Operating System';
      case 'referrers': return 'Visits by Referrer';
      case 'days': return 'Visits by Day';
      case 'months': return 'Visits by Month';
      default: return 'Visit Statistics';
    }
  };

  const chartData = formatChartData();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Visit Statistics for Short URL: {shortCode}</CardTitle>
          <CardDescription>
            Analyze traffic to your shortened URL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:space-x-4 md:items-end space-y-4 md:space-y-0">
              <div className="space-y-1 flex-1">
                <Label htmlFor="statsType">Statistics Type</Label>
                <Select
                  value={statsType}
                  onValueChange={(value) => setStatsType(value as StatsType)}
                >
                  <SelectTrigger id="statsType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="countries">Countries</SelectItem>
                    <SelectItem value="cities">Cities</SelectItem>
                    <SelectItem value="browsers">Browsers</SelectItem>
                    <SelectItem value="os">Operating Systems</SelectItem>
                    <SelectItem value="referrers">Referrers</SelectItem>
                    <SelectItem value="days">Daily</SelectItem>
                    <SelectItem value="months">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="excludeBots"
                  checked={excludeBots}
                  onCheckedChange={setExcludeBots}
                />
                <Label htmlFor="excludeBots">Exclude bots</Label>
              </div>
            </div>

            <DateRangeSelector
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onClear={clearDateRange}
            />

            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-80 w-full" />
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">
                <p>{error}</p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={loadStats}
                >
                  Try Again
                </Button>
              </div>
            ) : stats ? (
              <>
                <StatsSummary stats={stats} />

                <Card>
                  <CardHeader>
                    <CardTitle>{formatStatsTitle()}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {statsType === 'days' || statsType === 'months' ? (
                      <VisitsLineChart
                        data={chartData as TimeBasedStatsItem[]}
                        dataKey="count"
                        nameKey={statsType === 'days' ? 'date' : 'month'}
                      />
                    ) : (
                      <VisitsBarChart
                        data={chartData as StatsItem[]}
                        dataKey="count"
                        nameKey="name"
                      />
                    )}
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
