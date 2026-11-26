import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sortGroundReports} from '../fishing-grounds.mjs';

const entries=[
 {id:0,crabPrice:65,salmonPrice:240,crab:{low:70,high:90},salmon:{low:50,high:60}},
 {id:1,crabPrice:325,salmonPrice:50,crab:{low:80,high:90},salmon:{low:60,high:70}},
 {id:2,crabPrice:120,salmonPrice:100,crab:{low:0,high:40},salmon:{low:40,high:100}},
 {id:3,crabPrice:325,salmonPrice:90,crab:{low:65,high:95},salmon:{low:55,high:65}}
];
const ids=reports=>reports.map(report=>report.id);

test('price sorts the selected fishery descending, preserving ground order on ties',()=>{
 assert.deepEqual(ids(sortGroundReports(entries,'crab-price')),[1,3,2,0]);
 assert.deepEqual(ids(sortGroundReports(entries,'salmon-price')),[0,2,3,1]);
});

test('potential sorts by the midpoint of the displayed range for the selected fishery',()=>{
 assert.deepEqual(ids(sortGroundReports(entries,'crab-potential')),[1,0,3,2]);
 assert.deepEqual(ids(sortGroundReports(entries,'salmon-potential')),[2,1,3,0]);
});

test('sort choices leave the original ground order intact',()=>{
 assert.deepEqual(ids(sortGroundReports(entries,'default')),[0,1,2,3]);
 assert.deepEqual(ids(entries),[0,1,2,3]);
});
